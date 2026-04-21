package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.service.CDService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173", exposedHeaders = "Total-Count")
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

    @GetMapping("/api/cds/paged")
    public ResponseEntity<List<CD>> getPagedCDs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        List<CD> result = cdService.getPagedCDs(page, size);

        return ResponseEntity.ok()
                .header("Total-Count", String.valueOf(cdService.count()))
                .body(result);
    }

    @GetMapping("/api/cds/{id}")
    public ResponseEntity<CD> getCD(@PathVariable int id) {
        CD cd = cdService.getCDByIndex(id);
        System.out.println("get cd with id = " + id);
        if (cd == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cd);
    }

    @DeleteMapping("/api/cds/{id}")
    public ResponseEntity<String> deleteCD(@PathVariable int id) {
        CD cd = cdService.deleteCD(id);
        if (cd == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("CD removed from RAM successfully!");
    }

    @PutMapping("/api/cds/{id}")
    public ResponseEntity<CD> updateCD(@PathVariable int id, @RequestBody CD updatedCd) {
        if (updatedCd.getTitle() == null || updatedCd.getArtist() == null) {
            return ResponseEntity.badRequest().build();
        }
        CD result = cdService.updateCD(id, updatedCd);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/cds/stats/ratings")
    public ResponseEntity<Map<Integer, Long>> getRatingStats() {
        return ResponseEntity.ok(cdService.getRatingDistribution());
    }
}