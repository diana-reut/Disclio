package com.example.DisclioApp.Server.config;

import com.example.DisclioApp.Server.controller.CDGeneratorGraphQLController;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketDisconnectListener {

    private final CDGeneratorGraphQLController generatorController;

    public WebSocketDisconnectListener(CDGeneratorGraphQLController generatorController) {
        this.generatorController = generatorController;
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        System.out.println("Client disconnected; stopping generator");

        generatorController.forceStop();
    }
}