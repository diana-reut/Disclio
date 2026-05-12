package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.model.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {
    List<WebAuthnCredential> findByUser(User user);
    Optional<WebAuthnCredential> findByCredentialId(String credentialId);
    long countByUser(User user);
}
