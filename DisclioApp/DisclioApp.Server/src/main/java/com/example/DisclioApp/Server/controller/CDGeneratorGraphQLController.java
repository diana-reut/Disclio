package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.service.AuthService;
import com.example.DisclioApp.Server.service.CDGeneratorService;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

@Controller
public class CDGeneratorGraphQLController {

    private final CDGeneratorService generatorService;
    private final AuthService authService;

    public CDGeneratorGraphQLController(CDGeneratorService generatorService, AuthService authService) {
        this.generatorService = generatorService;
        this.authService = authService;
    }

    @MutationMapping
    public String startGenerator() {
        authService.requirePermission("START_GENERATOR");
        System.out.println("generator started");
        return generatorService.start();
    }

    @MutationMapping
    public String stopGenerator() {
        authService.requirePermission("STOP_GENERATOR");
        System.out.println("generator stopped");
        return generatorService.stop();
    }
}
