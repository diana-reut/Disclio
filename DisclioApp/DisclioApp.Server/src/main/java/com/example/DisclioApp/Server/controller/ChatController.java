package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.ChatMessage;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;

@Controller
public class ChatController {

    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(MongoTemplate mongoTemplate, SimpMessagingTemplate messagingTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send") // Full path: /app/chat.send
    public void sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());

        // Save to MongoDB (NoSQL Requirement)
        mongoTemplate.save(chatMessage);

        // Broadcast to anyone listening to /topic/public
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}