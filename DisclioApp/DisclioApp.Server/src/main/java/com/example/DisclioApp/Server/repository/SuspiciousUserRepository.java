package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.SuspiciousUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuspiciousUserRepository extends JpaRepository<SuspiciousUser, Integer> {
    // Helps us avoid flagging the same user 100 times in a row
    boolean existsByUserId(Integer userId);
}