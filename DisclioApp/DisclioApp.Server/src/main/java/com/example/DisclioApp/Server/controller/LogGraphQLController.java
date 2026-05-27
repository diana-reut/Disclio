package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.Log;
import com.example.DisclioApp.Server.service.AuthService;
import com.example.DisclioApp.Server.service.LogService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class LogGraphQLController {
    private final LogService logService;
    private final AuthService authService;

    public LogGraphQLController(LogService logService, AuthService authService) {
        this.logService = logService;
        this.authService = authService;
    }

    @QueryMapping
    public List<Log> getSystemLogs() {
        authService.requirePermission("VIEW_LOG");
        return logService.getAllLogs();
    }

    @QueryMapping
    public List<Log> pagedSystemLogs(@Argument int page, @Argument int size) {
        authService.requirePermission("VIEW_LOG");
        return logService.getPagedLogs(page, size);
    }

    @QueryMapping
    public int totalLogCount() {
        authService.requirePermission("VIEW_LOG");
        return logService.count();
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
