package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.repository.CDRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CDService {
    private final CDRepository cdRepository;

    public CDService(CDRepository cdRepository) {
        this.cdRepository = cdRepository;
    }

    public void addCD(CD cd) {
        cdRepository.save(cd);
    }

    public List<CD> getAllCDs() {
        return cdRepository.findAll();
    }

    public CD getCDByIndex(int id) {
        return cdRepository.findById(id).orElse(null);
    }

    public CD deleteCD(int id) {
        return cdRepository.deleteCD(id).orElse(null);
    }

    public CD updateCD(int id, CD updatedCd) {
        return cdRepository.update(id, updatedCd).orElse(null);
    }

    public Map<Integer, Long> getRatingDistribution() {
        System.out.println("Service: called for the map for statistics");
        return cdRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        CD::getRating,
                        Collectors.counting()
                ));
    }

    public List<CD> getPagedCDs(int page, int size) {
        var cds = cdRepository.findAll();
        int start = page * size;
        int end = Math.min((start + size), cds.size());

        if (start >= cds.size()) {
            return Collections.emptyList(); // Crucial for "hasMore" to work
        }
        return cds.subList(start, end);
    }

    public int count() {
        return cdRepository.count();
    }
}