package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.model.Song;
import com.github.javafaker.Faker;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class CDGeneratorService {

    private final CDService cdService;
    private final SongService songService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Faker faker = new Faker();

    private ExecutorService executor;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public CDGeneratorService(CDService cdService,
                              SongService songService,
                              SimpMessagingTemplate messagingTemplate) {
        this.cdService = cdService;
        this.songService = songService;
        this.messagingTemplate = messagingTemplate;
    }

    public String start() {
        if (!isRunning.compareAndSet(false, true)) {
            return "Already running";
        }

        executor = Executors.newSingleThreadExecutor();

        executor.submit(() -> {
            System.out.println("GENERATOR THREAD STARTED");

            while (isRunning.get()) {
                try {
                    System.out.println("LOOP...");

                    CD cd = new CD();
                    cd.setTitle(faker.music().genre() + " Album");
                    cd.setArtist(faker.rockBand().name());
                    cd.setYear(faker.number().numberBetween(1970, 2026));
                    cd.setRating(faker.number().numberBetween(1, 5));
                    cd.setCategory(faker.music().genre());

                    cdService.addCD(cd);

                    if (cd.getId() == 0) {
                        throw new RuntimeException("CD ID NOT GENERATED");
                    }

                    int numberOfSongs = faker.number().numberBetween(5, 10);

                    for (int i = 1; i <= numberOfSongs; i++) {
                        Song song = new Song();
                        song.setCdId(cd.getId());
                        song.setTitle(faker.music().instrument() + " Track");
                        song.setDuration("3:0" + faker.number().numberBetween(0, 9));
                        song.setTrackNumber(i);
                        songService.addSong(song);
                    }

                    messagingTemplate.convertAndSend("/topic/cds", cd);

                    System.out.println("Generated CD: " + cd.getTitle());

                    Thread.sleep(1000);

                } catch (InterruptedException e) {
                    System.out.println("Generator interrupted");
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            System.out.println("GENERATOR THREAD STOPPED");
        });

        return "Generator started";
    }

    public String stop() {
        if (!isRunning.compareAndSet(true, false)) {
            return "Not running";
        }

        if (executor != null) {
            executor.shutdownNow();
        }

        return "Generator stopped";
    }
}