//package com.example.DisclioApp.Server.controller;
//
//import com.example.DisclioApp.Server.model.CD;
//import com.example.DisclioApp.Server.model.Song;
//import com.example.DisclioApp.Server.service.CDService;
//import com.example.DisclioApp.Server.service.SongService; // Added
//import com.github.javafaker.Faker;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.ArrayList;
//import java.util.List;
//import java.util.concurrent.Executors;
//import java.util.concurrent.ScheduledExecutorService;
//import java.util.concurrent.TimeUnit;
//import java.util.concurrent.atomic.AtomicBoolean;
//
//@RestController
//@RequestMapping("/api/generator")
//@CrossOrigin(origins = "*")
//public class CDGeneratorController {
//
//    private final CDService cdService;
//    private final SongService songService; // Added
//    private final SimpMessagingTemplate messagingTemplate;
//    private final Faker faker = new Faker();
//
//    private ScheduledExecutorService executor;
//    private final AtomicBoolean isRunning = new AtomicBoolean(false);
//
//    public CDGeneratorController(CDService cdService, SongService songService, SimpMessagingTemplate messagingTemplate) {
//        this.cdService = cdService;
//        this.songService = songService;
//        this.messagingTemplate = messagingTemplate;
//    }
//
//    @PostMapping("/start")
//    public ResponseEntity<String> start() {
//        if (isRunning.compareAndSet(false, true)) {
//            executor = Executors.newSingleThreadScheduledExecutor();
//            executor.scheduleAtFixedRate(() -> {
//                try {
//                    CD newCd = createFakeCDMetadata();
//                    cdService.addCD(newCd);
//                    int generatedId = newCd.getId();
//
//                    List<Song> fakeSongs = generateAndSaveFakeSongs(generatedId);
//
//                    newCd.setSongs(fakeSongs);
//
//                    messagingTemplate.convertAndSend("/topic/cds", newCd);
//
//                    System.out.println("Generated CD #" + generatedId + " with " + fakeSongs.size() + " songs.");
//                } catch (Exception e) {
//                    System.err.println("Error in generator loop: " + e.getMessage());
//                    e.printStackTrace();
//                }
//            }, 0, 2, TimeUnit.SECONDS);
//
//            return ResponseEntity.ok("Generator started successfully.");
//        }
//        return ResponseEntity.status(HttpStatus.CONFLICT).body("Generator is already running.");
//    }
//
//    @PostMapping("/stop")
//    public ResponseEntity<String> stop() {
//        if (isRunning.compareAndSet(true, false)) {
//            if (executor != null && !executor.isShutdown()) {
//                executor.shutdownNow();
//            }
//            System.out.println("generator stopped");
//            return ResponseEntity.ok("Generator stopped.");
//        }
//        return ResponseEntity.ok("Generator was not running.");
//    }
//
//    // Refactored to focus only on CD fields
//    private CD createFakeCDMetadata() {
//        CD cd = new CD();
//        cd.setTitle(faker.book().title());
//        cd.setArtist(faker.rockBand().name());
//        cd.setYear(faker.number().numberBetween(1960, 2026));
//        cd.setRating(faker.number().numberBetween(1, 5));
//        cd.setCategory(faker.music().genre());
//        cd.setCondition("Mint");
//        cd.setManufacturer(faker.company().name());
//        cd.setDescription("Faker generated CD");
//        return cd;
//    }
//
//    // New helper to handle the "Many" side of the relationship
//    private List<Song> generateAndSaveFakeSongs(int cdId) {
//        int numSongs = faker.number().numberBetween(5, 12);
//        List<Song> songs = new ArrayList<>();
//
//        for (int i = 1; i <= numSongs; i++) {
//            Song song = new Song();
//            song.setCdId(cdId); // Important: Link to parent
//            song.setTitle(faker.funnyName().name());
//            song.setDuration(faker.number().numberBetween(2, 5) + ":" + String.format("%02d", faker.number().numberBetween(0, 59)));
//            song.setTrackNumber(i);
//
//            // Save each song via the service (matches your GraphQL logic)
//            songService.addSong(song);
//            songs.add(song);
//        }
//        return songs;
//    }
//}