package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.Log;
import com.example.DisclioApp.Server.service.LogService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class LogGraphQLController {
    private final LogService logService;

    public LogGraphQLController(LogService logService) {
        this.logService = logService;
    }

    @QueryMapping
    public List<Log> getSystemLogs() {
        return logService.getAllLogs();
    }

    @MutationMapping
    public String createManualLog(
            @Argument Integer userId,
            @Argument String role,
            @Argument String action
    ) {
        logService.recordLog(userId, role, action);
        return "Log persisted successfully to SQL Server";
    }
}