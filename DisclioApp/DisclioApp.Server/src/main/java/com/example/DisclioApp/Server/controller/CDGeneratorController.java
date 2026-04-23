package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.service.CDService;
import com.github.javafaker.Faker;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/generator")
@CrossOrigin(origins = "*")
public class CDGeneratorController {

    private final CDService cdService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Faker faker = new Faker();

    private ScheduledExecutorService executor;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public CDGeneratorController(CDService cdService, SimpMessagingTemplate messagingTemplate) {
        this.cdService = cdService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/start")
    public ResponseEntity<String> start() {
        if (isRunning.getAndSet(true)) return ResponseEntity.ok("Already running");

        executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(() -> {
            try {
                // Generate
                CD cd = new CD();
                cd.setTitle(faker.music().genre() + " Anthology");
                cd.setArtist(faker.rockBand().name());
                cd.setYear(faker.number().numberBetween(1970, 2026));
                cd.setRating(faker.number().numberBetween(1, 5));
                cd.setCategory(faker.music().genre());

                // Save
                cdService.addCD(cd);

                // Broadcast alert to React client
                messagingTemplate.convertAndSend("/topic/cds", cd);
                System.out.println("SENT TO WS: " + cd.getTitle());

                System.out.println("Pushed new CD via WebSocket: " + cd.getTitle());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 0, 2, TimeUnit.SECONDS);

        return ResponseEntity.ok("Generator started");
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stop() {
        isRunning.set(false);
        if (executor != null) executor.shutdownNow();
        return ResponseEntity.ok("Generator stopped");
    }
}