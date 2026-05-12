package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.EmailLoginCode;
import com.example.DisclioApp.Server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailLoginCodeRepository extends JpaRepository<EmailLoginCode, Long> {
    List<EmailLoginCode> findByUserAndUsedAtIsNull(User user);
}
