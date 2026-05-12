package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.model.WebAuthnCredential;
import com.example.DisclioApp.Server.repository.UserRepository;
import com.example.DisclioApp.Server.repository.WebAuthnCredentialRepository;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebAuthnService implements WebAuthnOperations {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String RP_NAME = "Disclio";

    private final WebAuthnCredentialRepositoryAdapter credentialRepositoryAdapter;
    private final WebAuthnCredentialRepository webAuthnCredentialRepository;
    private final UserRepository userRepository;
    private final ConcurrentHashMap<String, String> pendingRegistrationOptions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> pendingAssertionRequests = new ConcurrentHashMap<>();

    public WebAuthnService(
            WebAuthnCredentialRepositoryAdapter credentialRepositoryAdapter,
            WebAuthnCredentialRepository webAuthnCredentialRepository,
            UserRepository userRepository
    ) {
        this.credentialRepositoryAdapter = credentialRepositoryAdapter;
        this.webAuthnCredentialRepository = webAuthnCredentialRepository;
        this.userRepository = userRepository;
    }

    @Override
    public String startPasskeyRegistration(User user, String rpId, String origin) {
        User managedUser = ensureUserHandle(user);
        RelyingParty relyingParty = buildRelyingParty(rpId, origin);

        try {
            PublicKeyCredentialCreationOptions request = relyingParty.startRegistration(
                    StartRegistrationOptions.builder()
                            .user(toUserIdentity(managedUser))
                            .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                    .userVerification(UserVerificationRequirement.REQUIRED)
                                    .build())
                            .build()
            );

            pendingRegistrationOptions.put(managedUser.getUsername(), request.toJson());
            return request.toCredentialsCreateJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Could not start passkey registration. " + rootMessage(ex), ex);
        }
    }

    @Override
    public boolean finishPasskeyRegistration(User user, String rpId, String origin, String credentialJson) {
        String requestJson = pendingRegistrationOptions.remove(user.getUsername());
        if (requestJson == null) {
            throw new IllegalStateException("No passkey registration is in progress.");
        }

        try {
            User managedUser = ensureUserHandle(user);
            RelyingParty relyingParty = buildRelyingParty(rpId, origin);
            PublicKeyCredentialCreationOptions request = PublicKeyCredentialCreationOptions.fromJson(requestJson);
            PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> response =
                    PublicKeyCredential.parseRegistrationResponseJson(credentialJson);

            RegistrationResult result = relyingParty.finishRegistration(FinishRegistrationOptions.builder()
                    .request(request)
                    .response(response)
                    .build());

            String credentialId = result.getKeyId().getId().getBase64Url();
            WebAuthnCredential credential = webAuthnCredentialRepository.findByCredentialId(credentialId)
                    .orElseGet(WebAuthnCredential::new);
            credential.setUser(managedUser);
            credential.setCredentialId(credentialId);
            credential.setPublicKeyCose(result.getPublicKeyCose().getBase64Url());
            credential.setSignatureCount(result.getSignatureCount());
            credential.setTransports("");
            webAuthnCredentialRepository.save(credential);

            return true;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not finish passkey registration. " + rootMessage(ex), ex);
        }
    }

    @Override
    public String startAuthentication(User user, String ceremonyId, String rpId, String origin) {
        ensureUserHandle(user);
        RelyingParty relyingParty = buildRelyingParty(rpId, origin);

        try {
            AssertionRequest request = relyingParty.startAssertion(
                    StartAssertionOptions.builder()
                            .username(user.getUsername())
                            .userVerification(UserVerificationRequirement.REQUIRED)
                            .build()
            );

            pendingAssertionRequests.put(ceremonyId, request.toJson());
            return request.toCredentialsGetJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Could not start device verification. " + rootMessage(ex), ex);
        }
    }

    @Override
    public void finishAuthentication(User user, String ceremonyId, String rpId, String origin, String credentialJson) {
        String requestJson = pendingAssertionRequests.remove(ceremonyId);
        if (requestJson == null) {
            throw new IllegalStateException("No device verification is in progress.");
        }

        try {
            ensureUserHandle(user);
            RelyingParty relyingParty = buildRelyingParty(rpId, origin);
            AssertionRequest request = AssertionRequest.fromJson(requestJson);
            PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> response =
                    PublicKeyCredential.parseAssertionResponseJson(credentialJson);

            AssertionResult result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                    .request(request)
                    .response(response)
                    .build());

            if (!user.getUsername().equals(result.getUsername())) {
                throw new IllegalStateException("Device verification resolved to a different user.");
            }

            RegisteredCredential credentialResult = result.getCredential();
            webAuthnCredentialRepository.findByCredentialId(credentialResult.getCredentialId().getBase64Url())
                    .ifPresent(credential -> {
                        credential.setSignatureCount(result.getSignatureCount());
                        webAuthnCredentialRepository.save(credential);
                    });
        } catch (Exception ex) {
            throw new IllegalStateException("Could not complete device verification. " + rootMessage(ex), ex);
        }
    }

    @Override
    public boolean hasCredentials(User user) {
        return countCredentials(user) > 0;
    }

    @Override
    public int countCredentials(User user) {
        return (int) webAuthnCredentialRepository.countByUser(user);
    }

    private User ensureUserHandle(User user) {
        if (user.getWebauthnUserHandle() != null && !user.getWebauthnUserHandle().isBlank()) {
            return user;
        }

        byte[] userHandle = new byte[32];
        SECURE_RANDOM.nextBytes(userHandle);
        user.setWebauthnUserHandle(new ByteArray(userHandle).getBase64Url());
        return userRepository.save(user);
    }

    private UserIdentity toUserIdentity(User user) {
        String displayName = user.getFirstName() != null && !user.getFirstName().isBlank()
                ? user.getFirstName() + (user.getLastName() != null && !user.getLastName().isBlank() ? " " + user.getLastName() : "")
                : user.getUsername();

        return UserIdentity.builder()
                .name(user.getUsername())
                .displayName(displayName)
                .id(decodeBase64Url(user.getWebauthnUserHandle()))
                .build();
    }

    private RelyingParty buildRelyingParty(String rpId, String origin) {
        return RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder()
                        .id(rpId)
                        .name(RP_NAME)
                        .build())
                .credentialRepository(credentialRepositoryAdapter)
                .origins(Set.of(origin))
                .build();
    }

    private ByteArray decodeBase64Url(String value) {
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Stored WebAuthn data is invalid.", ex);
        }
    }

    private String rootMessage(Exception ex) {
        Throwable current = ex;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        String message = current.getMessage();
        return message == null || message.isBlank() ? "Unknown WebAuthn error." : message;
    }
}
