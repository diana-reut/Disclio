package com.example.DisclioApp.Server.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "observation_list")
public class SuspiciousUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    private String username;
    private String reason;

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;

    public SuspiciousUser() {}

    public SuspiciousUser(Integer userId, String username, String reason) {
        this.userId = userId;
        this.username = username;
        this.reason = reason;
        this.detectedAt = LocalDateTime.now();
    }

    // Getters
    public Integer getId() { return id; }
    public Integer getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getReason() { return reason; }
    public String getDetectedAt() {
        return detectedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}