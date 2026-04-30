package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.service.CDGeneratorService;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

@Controller
public class CDGeneratorGraphQLController {

    private final CDGeneratorService generatorService;

    public CDGeneratorGraphQLController(CDGeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    @MutationMapping
    public String startGenerator() {
        System.out.println("generator started");
        return generatorService.start();
    }

    @MutationMapping
    public String stopGenerator() {
        System.out.println("generator stopped");
        return generatorService.stop();
    }
}