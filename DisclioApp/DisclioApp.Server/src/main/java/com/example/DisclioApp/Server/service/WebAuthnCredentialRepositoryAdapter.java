package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.model.WebAuthnCredential;
import com.example.DisclioApp.Server.repository.UserRepository;
import com.example.DisclioApp.Server.repository.WebAuthnCredentialRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.PublicKeyCredentialType;
import com.yubico.webauthn.data.AuthenticatorTransport;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class WebAuthnCredentialRepositoryAdapter implements CredentialRepository {
    private final UserRepository userRepository;
    private final WebAuthnCredentialRepository webAuthnCredentialRepository;

    public WebAuthnCredentialRepositoryAdapter(
            UserRepository userRepository,
            WebAuthnCredentialRepository webAuthnCredentialRepository
    ) {
        this.userRepository = userRepository;
        this.webAuthnCredentialRepository = webAuthnCredentialRepository;
    }

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return userRepository.findByUsername(username)
                .map(webAuthnCredentialRepository::findByUser)
                .orElseGet(java.util.List::of)
                .stream()
                .map(this::toDescriptor)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return userRepository.findByUsername(username)
                .map(User::getWebauthnUserHandle)
                .filter(handle -> handle != null && !handle.isBlank())
                .map(this::decodeBase64Url);
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return userRepository.findByWebauthnUserHandle(userHandle.getBase64Url())
                .map(User::getUsername);
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return webAuthnCredentialRepository.findByCredentialId(credentialId.getBase64Url())
                .filter(credential -> userHandle.getBase64Url().equals(credential.getUser().getWebauthnUserHandle()))
                .map(this::toRegisteredCredential);
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return webAuthnCredentialRepository.findByCredentialId(credentialId.getBase64Url())
                .stream()
                .map(this::toRegisteredCredential)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private RegisteredCredential toRegisteredCredential(WebAuthnCredential credential) {
        return RegisteredCredential.builder()
                .credentialId(decodeBase64Url(credential.getCredentialId()))
                .userHandle(decodeBase64Url(credential.getUser().getWebauthnUserHandle()))
                .publicKeyCose(decodeBase64Url(credential.getPublicKeyCose()))
                .signatureCount(credential.getSignatureCount())
                .build();
    }

    private PublicKeyCredentialDescriptor toDescriptor(WebAuthnCredential credential) {
        PublicKeyCredentialDescriptor.PublicKeyCredentialDescriptorBuilder builder = PublicKeyCredentialDescriptor.builder()
                .id(decodeBase64Url(credential.getCredentialId()))
                .type(PublicKeyCredentialType.PUBLIC_KEY);

        Set<AuthenticatorTransport> transports = parseTransports(credential.getTransports());
        if (!transports.isEmpty()) {
            builder.transports(transports);
        }

        return builder.build();
    }

    private Set<AuthenticatorTransport> parseTransports(String transports) {
        if (transports == null || transports.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(transports.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(String::toUpperCase)
                .map(AuthenticatorTransport::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private ByteArray decodeBase64Url(String value) {
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Stored WebAuthn data is invalid.", ex);
        }
    }
}
