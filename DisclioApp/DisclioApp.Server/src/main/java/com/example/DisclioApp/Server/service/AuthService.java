package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.config.AuthProperties;
import com.example.DisclioApp.Server.model.AuthSession;
import com.example.DisclioApp.Server.model.PasswordResetResponse;
import com.example.DisclioApp.Server.model.PasswordResetToken;
import com.example.DisclioApp.Server.model.Permission;
import com.example.DisclioApp.Server.model.Role;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.AuthSessionRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Service
public class AuthService {
    public static final String ACCESS_TOKEN_COOKIE = "disclio_access_token";
    private static final String PASSWORD_RESET_MESSAGE = "If that account exists, you can use the recovery token below to reset the password.";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordRecoveryNotifier passwordRecoveryNotifier;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuthSessionRepository authSessionRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordRecoveryNotifier passwordRecoveryNotifier,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.authSessionRepository = authSessionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordRecoveryNotifier = passwordRecoveryNotifier;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
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

        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setLastActivityAt(Instant.now());
        session.setExpiresAt(session.getLastActivityAt().plus(Duration.ofMinutes(authProperties.getInactivityTimeoutMinutes())));
        session.setRevoked(false);
        authSessionRepository.save(session);

        writeAccessTokenCookie(response, user, session);
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

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash password reset token.", ex);
        }
    }
}
