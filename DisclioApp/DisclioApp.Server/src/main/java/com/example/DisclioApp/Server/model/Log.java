package com.example.DisclioApp.Server.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "logs")
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "group_role")
    private String groupRole; // e.g., "ADMIN" or "USER"

    @Column(name = "action_information", length = 1000)
    private String actionInformation;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public Log() {}

    public Log(Integer userId, String groupRole, String actionInformation) {
        this.userId = userId;
        this.groupRole = groupRole;
        this.actionInformation = actionInformation;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public Integer getUserId() { return userId; }
    public String getGroupRole() { return groupRole; }
    public String getActionInformation() { return actionInformation; }
    public String getTimestamp() {
        return timestamp.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}