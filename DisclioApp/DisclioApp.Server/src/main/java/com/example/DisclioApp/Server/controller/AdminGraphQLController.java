package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.SuspiciousUser;
import com.example.DisclioApp.Server.repository.SuspiciousUserRepository;
import com.example.DisclioApp.Server.service.AuthService;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class AdminGraphQLController {

    private final SuspiciousUserRepository suspiciousRepo;
    private final AuthService authService;

    public AdminGraphQLController(SuspiciousUserRepository suspiciousRepo, AuthService authService) {
        this.suspiciousRepo = suspiciousRepo;
        this.authService = authService;
    }

    @QueryMapping
    public List<SuspiciousUser> getObservationList() {
        authService.requirePermission("VIEW_LOG");
        return suspiciousRepo.findAll();
    }
}
