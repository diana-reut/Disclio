package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.service.CDService;
import com.github.javafaker.Faker;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Controller
public class CDGeneratorGraphQLController {

    private final CDService cdService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Faker faker = new Faker();

    private ScheduledExecutorService executor;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public CDGeneratorGraphQLController(CDService cdService,
                                        SimpMessagingTemplate messagingTemplate) {
        this.cdService = cdService;
        this.messagingTemplate = messagingTemplate;
    }

    @MutationMapping
    public String startGenerator() {
        if (isRunning.getAndSet(true)) {
            return "Already running";
        }

        executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                CD cd = new CD();
                cd.setTitle(faker.music().genre() + " Anthology");
                cd.setArtist(faker.rockBand().name());
                cd.setYear(faker.number().numberBetween(1970, 2026));
                cd.setRating(faker.number().numberBetween(1, 5));
                cd.setCategory(faker.music().genre());

                cdService.addCD(cd);

                messagingTemplate.convertAndSend("/topic/cds", cd);

                System.out.println("Generated CD: " + cd.getTitle());

            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 0, 2, TimeUnit.SECONDS);

        return "Generator started";
    }

    public void forceStop() {
        isRunning.set(false);

        if (executor != null) {
            executor.shutdownNow();
        }

        System.out.println("Generator FORCE STOPPED");
    }

    @MutationMapping
    public String stopGenerator() {
        forceStop();
        return "Generator stopped";
    }
}