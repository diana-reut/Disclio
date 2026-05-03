package com.example.DisclioApp.Server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name; // e.g., "READ_CD", "DELETE_CD", "WRITE_CD"
}