package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByWebauthnUserHandle(String webauthnUserHandle);
}
