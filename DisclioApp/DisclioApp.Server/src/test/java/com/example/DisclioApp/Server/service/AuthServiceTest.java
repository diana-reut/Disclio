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
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.AuthSessionRepository;
import com.example.DisclioApp.Server.repository.EmailLoginCodeRepository;
import com.example.DisclioApp.Server.repository.PasswordResetTokenRepository;
import com.example.DisclioApp.Server.repository.RoleRepository;
import com.example.DisclioApp.Server.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuthSessionRepository authSessionRepository;

    @Mock
    private EmailLoginCodeRepository emailLoginCodeRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailLoginCodeNotifier emailLoginCodeNotifier;

    @Mock
    private PasswordRecoveryNotifier passwordRecoveryNotifier;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HttpServletResponse response;

    @Mock
    private TotpOperations totpService;

    private AuthProperties authProperties;
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authProperties = new AuthProperties();
        authProperties.setJwtSecret("0123456789abcdef0123456789abcdef0123456789abcdef");
        authProperties.setAccessTokenMinutes(30);
        authProperties.setInactivityTimeoutMinutes(15);
        authProperties.setPasswordResetTokenMinutes(15);
        authProperties.setEmailLoginCodeMinutes(10);
        authProperties.setSecureCookies(false);

        jwtService = new JwtService(authProperties);
        authService = new AuthService(
                userRepository,
                roleRepository,
                authSessionRepository,
                emailLoginCodeRepository,
                passwordResetTokenRepository,
                emailLoginCodeNotifier,
                passwordRecoveryNotifier,
                passwordEncoder,
                jwtService,
                authProperties,
                totpService
        );
    }

    @Test
    void registerHashesPasswordAndAssignsUserRole() {
        Role userRole = roleWithPermissions("USER", "READ_CD");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("secret")).thenReturn("hashed-secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User savedUser = authService.register("alice", "secret", "Alice", "Doe", "alice@example.com");

        assertThat(savedUser.getPassword()).isEqualTo("hashed-secret");
        assertThat(savedUser.getRole().getName()).isEqualTo("USER");
        assertThat(savedUser.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void authenticateCreatesSessionAndCookieForValidCredentials() {
        Role userRole = roleWithPermissions("USER", "READ_CD", "CREATE_CD");
        User user = new User();
        user.setUsername("alice");
        user.setPassword("$2a$10$hashed-secret");
        user.setRole(userRole);

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$10$hashed-secret")).thenReturn(true);
        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        User authenticatedUser = authService.authenticate("alice", "secret", response);

        assertThat(authenticatedUser.getUsername()).isEqualTo("alice");

        ArgumentCaptor<AuthSession> sessionCaptor = ArgumentCaptor.forClass(AuthSession.class);
        verify(authSessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getExpiresAt()).isAfter(Instant.now());
        verify(response).addHeader(any(String.class), any(String.class));
    }

    @Test
    void authenticateRejectsInvalidPassword() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword("$2a$10$hashed-secret");

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$10$hashed-secret")).thenReturn(false);

        assertThatThrownBy(() -> authService.authenticate("alice", "wrong", response))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void requestPasswordResetCreatesRecoverableTokenForKnownUser() {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");

        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PasswordResetResponse response = authService.requestPasswordReset("alice@example.com");

        assertThat(response.getMessage()).contains("If that account exists");
        assertThat(response.getResetToken()).isNull();
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(passwordRecoveryNotifier).sendPasswordResetToken(any(User.class), any(String.class));
    }

    @Test
    void requestEmailLoginCodeCreatesOneTimeCodeForKnownUser() {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");

        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(emailLoginCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());
        when(emailLoginCodeRepository.save(any(EmailLoginCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmailLoginCodeResponse response = authService.requestEmailLoginCode("alice@example.com");

        assertThat(response.getMessage()).contains("If that account exists");
        verify(emailLoginCodeRepository).save(any(EmailLoginCode.class));
        verify(emailLoginCodeNotifier).sendEmailLoginCode(any(User.class), any(String.class));
    }

    @Test
    void authenticateWithEmailCodeCreatesSessionForValidCode() {
        Role userRole = roleWithPermissions("USER", "READ_CD");
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setRole(userRole);

        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(emailLoginCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());
        when(emailLoginCodeRepository.save(any(EmailLoginCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.requestEmailLoginCode("alice@example.com");

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailLoginCodeNotifier).sendEmailLoginCode(any(User.class), codeCaptor.capture());

        EmailLoginCode code = new EmailLoginCode();
        code.setUser(user);
        code.setCodeHash(hash(codeCaptor.getValue()));
        code.setExpiresAt(Instant.now().plusSeconds(300));

        when(emailLoginCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of(code));
        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User authenticatedUser = authService.authenticateWithEmailCode("alice@example.com", codeCaptor.getValue(), response);

        assertThat(authenticatedUser.getUsername()).isEqualTo("alice");
        assertThat(code.getUsedAt()).isNotNull();
        verify(response).addHeader(any(String.class), any(String.class));
    }

    @Test
    void beginSecureLoginSendsCodeWhenPasskeyIsRegistered() {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPassword("$2a$10$hashed-secret");
        user.setTotpSecret("SECRET");
        user.setTotpEnabled(true);

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$10$hashed-secret")).thenReturn(true);

        ThreeWayLoginStartResponse response = authService.beginSecureLogin("alice", "secret");

        assertThat(response.getPendingLoginId()).isNotBlank();
        verify(emailLoginCodeNotifier).sendEmailLoginCode(any(User.class), any(String.class));
    }

    @Test
    void verifySecureLoginCodeAllowsFinishingWithAuthenticatorCode() {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPassword("$2a$10$hashed-secret");
        user.setTotpSecret("SECRET");
        user.setTotpEnabled(true);
        Role role = roleWithPermissions("USER", "READ_CD");
        user.setRole(role);

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$10$hashed-secret")).thenReturn(true);
        when(userRepository.findById(0)).thenReturn(Optional.of(user));
        when(totpService.verifyCode("SECRET", "123456")).thenReturn(true);
        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ThreeWayLoginStartResponse startResponse = authService.beginSecureLogin("alice", "secret");
        org.mockito.ArgumentCaptor<String> codeCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailLoginCodeNotifier).sendEmailLoginCode(any(User.class), codeCaptor.capture());

        ThreeWayLoginCodeResponse verificationResponse = authService.verifySecureLoginCode(
                startResponse.getPendingLoginId(),
                codeCaptor.getValue()
        );

        assertThat(verificationResponse.getPendingLoginId()).isEqualTo(startResponse.getPendingLoginId());

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, servletResponse));
        User authenticatedUser = authService.finishSecureLogin(startResponse.getPendingLoginId(), "123456");
        RequestContextHolder.resetRequestAttributes();

        assertThat(authenticatedUser.getUsername()).isEqualTo("alice");
        verify(totpService).verifyCode("SECRET", "123456");
    }

    @Test
    void resetPasswordUpdatesPasswordAndRevokesSessions() {
        User user = new User();
        user.setUsername("alice");

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(300));

        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setRevoked(false);

        issueResetTokenFor(user, "alice");
        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordRecoveryNotifier).sendPasswordResetToken(any(User.class), tokenCaptor.capture());
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(any(String.class))).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-secret")).thenReturn("hashed-new-secret");
        when(authSessionRepository.findByUserAndRevokedFalse(user)).thenReturn(List.of(session));

        boolean reset = authService.resetPassword(tokenCaptor.getValue(), "new-secret");

        assertThat(reset).isTrue();
        assertThat(user.getPassword()).isEqualTo("hashed-new-secret");
        assertThat(session.isRevoked()).isTrue();
        verify(userRepository).save(user);
    }

    private PasswordResetResponse issueResetTokenFor(User user, String identifier) {
        when(userRepository.findByUsername(identifier)).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        return authService.requestPasswordReset(identifier);
    }

    private Role roleWithPermissions(String roleName, String... permissionNames) {
        Role role = new Role(roleName);
        Set<Permission> permissions = Set.of(permissionNames).stream().map(name -> {
            Permission permission = new Permission();
            permission.setName(name);
            return permission;
        }).collect(java.util.stream.Collectors.toSet());
        role.setPermissions(permissions);
        return role;
    }

    private String hash(String rawValue) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(rawValue.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
