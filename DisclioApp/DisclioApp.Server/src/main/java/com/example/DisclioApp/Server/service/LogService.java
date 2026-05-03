package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.Log;
import com.example.DisclioApp.Server.repository.LogRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LogService {
    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public void recordLog(Integer userId, String role, String action) {
        Log log = new Log(userId, role, action);
        logRepository.save(log);
    }

    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }
}