package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.SuspiciousUser;
import com.example.DisclioApp.Server.repository.SuspiciousUserRepository;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class AdminGraphQLController {

    private final SuspiciousUserRepository suspiciousRepo;

    public AdminGraphQLController(SuspiciousUserRepository suspiciousRepo) {
        this.suspiciousRepo = suspiciousRepo;
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('VIEW_LOG')")
    public List<SuspiciousUser> getObservationList() {
        return suspiciousRepo.findAll();
    }
}
