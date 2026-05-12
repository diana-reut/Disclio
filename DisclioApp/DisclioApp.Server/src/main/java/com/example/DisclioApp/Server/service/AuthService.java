package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.config.AuthProperties;
import com.example.DisclioApp.Server.model.AuthSession;
import com.example.DisclioApp.Server.model.EmailLoginCode;
import com.example.DisclioApp.Server.model.EmailLoginCodeResponse;
import com.example.DisclioApp.Server.model.PasswordResetResponse;
import com.example.DisclioApp.Server.model.PasswordResetToken;
import com.example.DisclioApp.Server.model.Permission;
import com.example.DisclioApp.Server.model.Role;
import com.example.DisclioApp.Server.model.ThreeWayLoginCodeResponse;
import com.example.DisclioApp.Server.model.ThreeWayLoginStartResponse;
import com.example.DisclioApp.Server.model.TotpSetupResponse;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.AuthSessionRepository;
import com.example.DisclioApp.Server.repository.EmailLoginCodeRepository;
import com.example.DisclioApp.Server.repository.PasswordResetTokenRepository;
import com.example.DisclioApp.Server.repository.RoleRepository;
import com.example.DisclioApp.Server.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    public static final String ACCESS_TOKEN_COOKIE = "disclio_access_token";
    private static final String PASSWORD_RESET_MESSAGE = "If that account exists, you can use the recovery token below to reset the password.";
    private static final String EMAIL_LOGIN_CODE_MESSAGE = "If that account exists, we sent a one-time login code to the email on file.";
    private static final String SECURE_LOGIN_CODE_MESSAGE = "Password verified. We sent a one-time code to your email. Enter it to continue to the authenticator step.";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthSessionRepository authSessionRepository;
    private final EmailLoginCodeRepository emailLoginCodeRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailLoginCodeNotifier emailLoginCodeNotifier;
    private final PasswordRecoveryNotifier passwordRecoveryNotifier;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final TotpOperations totpService;
    private final Map<String, PendingSecureLogin> pendingSecureLogins = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuthSessionRepository authSessionRepository,
            EmailLoginCodeRepository emailLoginCodeRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailLoginCodeNotifier emailLoginCodeNotifier,
            PasswordRecoveryNotifier passwordRecoveryNotifier,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            TotpOperations totpService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.authSessionRepository = authSessionRepository;
        this.emailLoginCodeRepository = emailLoginCodeRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailLoginCodeNotifier = emailLoginCodeNotifier;
        this.passwordRecoveryNotifier = passwordRecoveryNotifier;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
        this.totpService = totpService;
    }

    public User register(String username, String password, String firstName, String lastName, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username is already in use.");
        }

        Role defaultRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("Default role USER is missing."));

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setRole(defaultRole);

        return userRepository.save(user);
    }

    public User authenticate(String username, String password) {
        return authenticate(username, password, currentResponse());
    }

    User authenticate(String username, String password, HttpServletResponse response) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));

        String storedPassword = user.getPassword();
        boolean validPassword = isPasswordMatch(password, storedPassword);

        if (!validPassword) {
            throw new BadCredentialsException("Invalid username or password.");
        }

        if (!isBcryptHash(storedPassword)) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }

        createAuthenticatedSession(user, response);
        return user;
    }

    public ThreeWayLoginStartResponse beginSecureLogin(String username, String password) {
        cleanupExpiredSecureLogins();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));

        String storedPassword = user.getPassword();
        if (!isPasswordMatch(password, storedPassword)) {
            throw new BadCredentialsException("Invalid username or password.");
        }

        if (!isBcryptHash(storedPassword)) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }

        if (!user.isTotpEnabled() || user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            throw new IllegalStateException("Set up authenticator verification in your account before using secure login.");
        }

        removeExistingSecureLoginsForUser(user.getId());

        String rawCode = generateEmailLoginCode();
        String pendingLoginId = UUID.randomUUID().toString();
        pendingSecureLogins.put(
                pendingLoginId,
                new PendingSecureLogin(
                        user.getId(),
                        hashToken(rawCode),
                        Instant.now().plus(Duration.ofMinutes(authProperties.getEmailLoginCodeMinutes())),
                        false
                )
        );
        emailLoginCodeNotifier.sendEmailLoginCode(user, rawCode);

        return new ThreeWayLoginStartResponse(SECURE_LOGIN_CODE_MESSAGE, pendingLoginId);
    }

    public ThreeWayLoginCodeResponse verifySecureLoginCode(String pendingLoginId, String code) {
        cleanupExpiredSecureLogins();
        PendingSecureLogin pendingSecureLogin = requirePendingSecureLogin(pendingLoginId);
        if (!pendingSecureLogin.codeHash().equals(hashToken(code == null ? "" : code.trim()))) {
            throw new BadCredentialsException("Invalid login code.");
        }

        User user = userRepository.findById(pendingSecureLogin.userId())
                .orElseThrow(() -> new BadCredentialsException("Secure login could not be completed."));

        pendingSecureLogins.put(
                pendingLoginId,
                new PendingSecureLogin(
                        pendingSecureLogin.userId(),
                        pendingSecureLogin.codeHash(),
                        pendingSecureLogin.expiresAt(),
                        true
                )
        );

        return new ThreeWayLoginCodeResponse(
                "Email code verified. Enter your authenticator code to finish logging in.",
                pendingLoginId
        );
    }

    public User finishSecureLogin(String pendingLoginId, String totpCode) {
        cleanupExpiredSecureLogins();
        PendingSecureLogin pendingSecureLogin = requirePendingSecureLogin(pendingLoginId);
        if (!pendingSecureLogin.codeVerified()) {
            throw new IllegalStateException("Verify the email code before entering your authenticator code.");
        }

        User user = userRepository.findById(pendingSecureLogin.userId())
                .orElseThrow(() -> new BadCredentialsException("Secure login could not be completed."));

        if (!totpService.verifyCode(user.getTotpSecret(), totpCode == null ? "" : totpCode.trim())) {
            throw new BadCredentialsException("Invalid authenticator code.");
        }

        pendingSecureLogins.remove(pendingLoginId);
        createAuthenticatedSession(user, currentResponse());
        return user;
    }

    public TotpSetupResponse startTotpSetup(User user) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists."));

        String secret = totpService.generateSecret();
        managedUser.setTotpSecret(secret);
        managedUser.setTotpEnabled(false);
        userRepository.save(managedUser);

        return new TotpSetupResponse(secret, totpService.buildOtpAuthUri(managedUser, secret));
    }

    public boolean finishTotpSetup(User user, String code) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists."));

        if (managedUser.getTotpSecret() == null || managedUser.getTotpSecret().isBlank()) {
            throw new IllegalStateException("Start authenticator setup first.");
        }

        if (!totpService.verifyCode(managedUser.getTotpSecret(), code == null ? "" : code.trim())) {
            throw new BadCredentialsException("Invalid authenticator code.");
        }

        managedUser.setTotpEnabled(true);
        userRepository.save(managedUser);
        return true;
    }

    public EmailLoginCodeResponse requestEmailLoginCode(String identifier) {
        Optional<User> userOptional = findUserByIdentifier(identifier);
        if (userOptional.isEmpty()) {
            return new EmailLoginCodeResponse(EMAIL_LOGIN_CODE_MESSAGE);
        }

        User user = userOptional.get();
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return new EmailLoginCodeResponse(EMAIL_LOGIN_CODE_MESSAGE);
        }

        Instant now = Instant.now();
        emailLoginCodeRepository.findByUserAndUsedAtIsNull(user).forEach(existingCode -> {
            existingCode.setUsedAt(now);
            emailLoginCodeRepository.save(existingCode);
        });

        String rawCode = generateEmailLoginCode();
        EmailLoginCode emailLoginCode = new EmailLoginCode();
        emailLoginCode.setUser(user);
        emailLoginCode.setCodeHash(hashToken(rawCode));
        emailLoginCode.setExpiresAt(now.plus(Duration.ofMinutes(authProperties.getEmailLoginCodeMinutes())));
        emailLoginCodeRepository.save(emailLoginCode);
        emailLoginCodeNotifier.sendEmailLoginCode(user, rawCode);

        return new EmailLoginCodeResponse(EMAIL_LOGIN_CODE_MESSAGE);
    }

    public User authenticateWithEmailCode(String identifier, String code) {
        return authenticateWithEmailCode(identifier, code, currentResponse());
    }

    User authenticateWithEmailCode(String identifier, String code, HttpServletResponse response) {
        if (identifier == null || identifier.isBlank() || code == null || code.isBlank()) {
            throw new BadCredentialsException("Invalid login code.");
        }

        User user = findUserByIdentifier(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid login code."));

        String hashedCode = hashToken(code.trim());
        Instant now = Instant.now();
        EmailLoginCode matchingCode = null;

        for (EmailLoginCode emailLoginCode : emailLoginCodeRepository.findByUserAndUsedAtIsNull(user)) {
            if (emailLoginCode.getExpiresAt().isBefore(now)) {
                emailLoginCode.setUsedAt(now);
                emailLoginCodeRepository.save(emailLoginCode);
                continue;
            }

            if (emailLoginCode.getCodeHash().equals(hashedCode)) {
                matchingCode = emailLoginCode;
                break;
            }
        }

        if (matchingCode == null) {
            throw new BadCredentialsException("Invalid login code.");
        }

        matchingCode.setUsedAt(now);
        emailLoginCodeRepository.save(matchingCode);
        createAuthenticatedSession(user, response);
        return user;
    }

    public Optional<User> resolveAuthenticatedUser(String token, HttpServletResponse response) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            Claims claims = jwtService.parse(token);
            String username = claims.getSubject();
            String sessionId = claims.get("sessionId", String.class);

            if (username == null || sessionId == null) {
                clearAuthentication(response);
                return Optional.empty();
            }

            Optional<AuthSession> sessionOptional = authSessionRepository.findById(sessionId);
            if (sessionOptional.isEmpty()) {
                clearAuthentication(response);
                return Optional.empty();
            }

            AuthSession session = sessionOptional.get();
            if (session.isRevoked() || session.getExpiresAt().isBefore(Instant.now())) {
                session.setRevoked(true);
                authSessionRepository.save(session);
                clearAuthentication(response);
                return Optional.empty();
            }

            User user = session.getUser();
            if (!user.getUsername().equals(username)) {
                session.setRevoked(true);
                authSessionRepository.save(session);
                clearAuthentication(response);
                return Optional.empty();
            }

            session.setLastActivityAt(Instant.now());
            session.setExpiresAt(session.getLastActivityAt().plus(Duration.ofMinutes(authProperties.getInactivityTimeoutMinutes())));
            authSessionRepository.save(session);
            writeAccessTokenCookie(response, user, session);
            return Optional.of(user);
        } catch (Exception ex) {
            clearAuthentication(response);
            return Optional.empty();
        }
    }

    public void logout() {
        HttpServletRequest request = currentRequest();
        HttpServletResponse response = currentResponse();
        String token = readAccessToken(request);

        if (token != null && !token.isBlank()) {
            try {
                Claims claims = jwtService.parse(token);
                String sessionId = claims.get("sessionId", String.class);
                if (sessionId != null) {
                    authSessionRepository.findById(sessionId).ifPresent(session -> {
                        session.setRevoked(true);
                        authSessionRepository.save(session);
                    });
                }
            } catch (Exception ignored) {
            }
        }

        clearAuthentication(response);
    }

    public PasswordResetResponse requestPasswordReset(String identifier) {
        Optional<User> userOptional = findUserByIdentifier(identifier);
        if (userOptional.isEmpty()) {
            return new PasswordResetResponse(PASSWORD_RESET_MESSAGE, null);
        }

        User user = userOptional.get();
        Instant now = Instant.now();
        passwordResetTokenRepository.findByUserAndUsedAtIsNull(user).forEach(existingToken -> {
            existingToken.setUsedAt(now);
            passwordResetTokenRepository.save(existingToken);
        });

        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hashToken(rawToken));
        resetToken.setExpiresAt(now.plus(Duration.ofMinutes(authProperties.getPasswordResetTokenMinutes())));
        passwordResetTokenRepository.save(resetToken);
        passwordRecoveryNotifier.sendPasswordResetToken(user, rawToken);

        return new PasswordResetResponse(PASSWORD_RESET_MESSAGE, null);
    }

    public boolean resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return false;
        }

        Optional<PasswordResetToken> resetTokenOptional = passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(hashToken(token));
        if (resetTokenOptional.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = resetTokenOptional.get();
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            resetToken.setUsedAt(Instant.now());
            passwordResetTokenRepository.save(resetToken);
            return false;
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        authSessionRepository.findByUserAndRevokedFalse(user).forEach(session -> {
            session.setRevoked(true);
            authSessionRepository.save(session);
        });

        ServletRequestAttributes attributes = currentServletAttributesOrNull();
        if (attributes != null && attributes.getResponse() != null) {
            clearAuthentication(attributes.getResponse());
        }

        return true;
    }

    public void clearAuthentication(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(authProperties.isSecureCookies())
                .sameSite(authProperties.getSameSite())
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void createAuthenticatedSession(User user, HttpServletResponse response) {
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setLastActivityAt(Instant.now());
        session.setExpiresAt(session.getLastActivityAt().plus(Duration.ofMinutes(authProperties.getInactivityTimeoutMinutes())));
        session.setRevoked(false);
        authSessionRepository.save(session);

        writeAccessTokenCookie(response, user, session);
    }

    private void writeAccessTokenCookie(HttpServletResponse response, User user, AuthSession session) {
        List<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getName)
                .sorted()
                .toList();

        String token = jwtService.generateAccessToken(user, session.getId(), permissions);
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(authProperties.isSecureCookies())
                .sameSite(authProperties.getSameSite())
                .path("/")
                .maxAge(Duration.ofMinutes(authProperties.getAccessTokenMinutes()))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attributes = currentServletAttributes();
        return attributes.getRequest();
    }

    private HttpServletResponse currentResponse() {
        ServletRequestAttributes attributes = currentServletAttributes();
        HttpServletResponse response = attributes.getResponse();
        if (response == null) {
            throw new IllegalStateException("No active HTTP response available.");
        }
        return response;
    }

    private ServletRequestAttributes currentServletAttributes() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            throw new IllegalStateException("No active servlet request available.");
        }
        return attributes;
    }

    private ServletRequestAttributes currentServletAttributesOrNull() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes;
        }
        return null;
    }

    private String readAccessToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        for (var cookie : request.getCookies()) {
            if (ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private boolean isPasswordMatch(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        return storedPassword.equals(rawPassword);
    }

    private boolean isBcryptHash(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private Optional<User> findUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier));
    }

    private String generateEmailLoginCode() {
        return "%06d".formatted(SECURE_RANDOM.nextInt(1_000_000));
    }

    private PendingSecureLogin requirePendingSecureLogin(String pendingLoginId) {
        if (pendingLoginId == null || pendingLoginId.isBlank()) {
            throw new BadCredentialsException("Invalid secure login request.");
        }

        PendingSecureLogin pendingSecureLogin = pendingSecureLogins.get(pendingLoginId);
        if (pendingSecureLogin == null || pendingSecureLogin.expiresAt().isBefore(Instant.now())) {
            pendingSecureLogins.remove(pendingLoginId);
            throw new IllegalStateException("This secure login request expired. Start again.");
        }
        return pendingSecureLogin;
    }

    private void removeExistingSecureLoginsForUser(int userId) {
        pendingSecureLogins.entrySet().removeIf(entry -> entry.getValue().userId() == userId);
    }

    private void cleanupExpiredSecureLogins() {
        Instant now = Instant.now();
        pendingSecureLogins.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash password reset token.", ex);
        }
    }

    private record PendingSecureLogin(
            int userId,
            String codeHash,
            Instant expiresAt,
            boolean codeVerified
    ) {
    }
}
