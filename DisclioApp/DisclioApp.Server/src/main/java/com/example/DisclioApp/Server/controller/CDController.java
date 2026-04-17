package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.service.CDService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class CDController {
    private final CDService cdService;

    public CDController(CDService cdService) {
        this.cdService = cdService;
    }

    @PostMapping("/api/cds")
    public ResponseEntity<String> addCD(@RequestBody CD newCd) {
        if (newCd.getTitle() == null || newCd.getArtist() == null) {
            return ResponseEntity.badRequest().body("Title and Artist are required!");
        }

        cdService.addCD(newCd);
        return ResponseEntity.ok("CD added to RAM successfully!");
    }

    @GetMapping("/api/cds")
    public ResponseEntity<List<CD>> getCDs() {
        return ResponseEntity.ok(cdService.getAllCDs());
    }

    @GetMapping("/api/cds/{i}")
    public ResponseEntity<CD> getCD(@PathVariable int i) {
        CD cd = cdService.getCDByIndex(i);
        if (cd == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cd);
    }

    @DeleteMapping("/api/cds/{i}")
    public ResponseEntity<String> deleteCD(@PathVariable int i) {
        CD cd = cdService.deleteCD(i);
        if (cd == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("CD removed from RAM successfully!");
    }

    @PutMapping("/api/cds/{i}")
    public ResponseEntity<CD> updateCD(@PathVariable int i, @RequestBody CD updatedCd) {
        if (updatedCd.getTitle() == null || updatedCd.getArtist() == null) {
            return ResponseEntity.badRequest().build();
        }
        CD result = cdService.updateCD(i, updatedCd);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }
}