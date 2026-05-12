package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.AuthSession;
import com.example.DisclioApp.Server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    List<AuthSession> findByUserAndRevokedFalse(User user);
}
