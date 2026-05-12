package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.PasswordResetToken;
import com.example.DisclioApp.Server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
}
