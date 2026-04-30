package com.example.DisclioApp.Server.config;

import com.example.DisclioApp.Server.service.CDGeneratorService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class WebSocketSessionListener {

    private final CDGeneratorService generatorService;

    // sessionId -> active session
    private final ConcurrentMap<String, Boolean> sessions = new ConcurrentHashMap<>();

    public WebSocketSessionListener(CDGeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        String sessionId = (String) event.getMessage()
                .getHeaders()
                .get("simpSessionId");

        if (sessionId != null) {
            sessions.put(sessionId, true);
            System.out.println("CONNECTED: " + sessionId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        sessions.remove(sessionId);

        // Optional: Add a slight delay check here
        // to see if a new session connected immediately (refresh case)
        if (sessions.isEmpty()) {
            generatorService.stop();
        }
    }
}