package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.repository.CDRepository;
import com.example.DisclioApp.Server.repository.SongRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CDService {
    private final CDRepository cdRepository;
    private final SongRepository songRepository;

    public CDService(CDRepository cdRepository, SongRepository songRepository) {
        this.cdRepository = cdRepository;
        this.songRepository = songRepository;
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

    @Transactional
    public CD deleteCD(int id) {
        return cdRepository.findById(id).map(cd -> {
            cdRepository.delete(cd); // Cascade will handle songs if configured in Entity
            return cd;
        }).orElse(null);
    }

    @Transactional
    public CD updateCD(int id, CD updatedCd) {
        return cdRepository.findById(id).map(existingCd -> {
            existingCd.updateCD(updatedCd);
            return cdRepository.save(existingCd);
        }).orElse(null);
    }

    public Map<Integer, Long> getRatingDistribution() {
        // Fetching stats directly using the custom repository method we discussed
        List<Object[]> stats = cdRepository.getRatingStats();
        return stats.stream().collect(Collectors.toMap(
                s -> (Integer) s[0],
                s -> (Long) s[1]
        ));
    }

    public List<CD> getPagedCDs(int page, int size) {
        // Use Spring Data's built-in pagination
        return cdRepository.findAll(PageRequest.of(page, size)).getContent();
    }

    public int count() {
        return (int) cdRepository.count();
    }
}

//import com.example.DisclioApp.Server.model.CD;
//import com.example.DisclioApp.Server.repository.CDRepository;
//import com.example.DisclioApp.Server.repository.SongRepository;
//import org.springframework.stereotype.Service;
//
//import java.util.Collections;
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;

//@Service
//public class CDService {
//    private final CDRepository cdRepository;
//    private final SongRepository songRepository;
//
//    public CDService(CDRepository cdRepository, SongRepository songRepository) {
//        this.cdRepository = cdRepository;
//        this.songRepository = songRepository;
//    }
//
//    public void addCD(CD cd) {
//        cdRepository.save(cd);
//    }
//
//    public List<CD> getAllCDs() {
//        return cdRepository.findAll();
//    }
//
//    public CD getCDByIndex(int id) {
//        return cdRepository.findById(id).orElse(null);
//    }
//
//    public CD deleteCD(int id) {
//        songRepository.deleteByCdId(id);
//        return cdRepository.deleteCD(id).orElse(null);
//    }
//
//    public CD updateCD(int id, CD updatedCd) {
//        return cdRepository.update(id, updatedCd).orElse(null);
//    }
//
//    public Map<Integer, Long> getRatingDistribution() {
//        System.out.println("Service: called for the map for statistics");
//        return cdRepository.findAll().stream()
//                .collect(Collectors.groupingBy(
//                        CD::getRating,
//                        Collectors.counting()
//                ));
//    }
//
//    public List<CD> getPagedCDs(int page, int size) {
//        var cds = cdRepository.findAll();
//        int start = page * size;
//        int end = Math.min((start + size), cds.size());
//
//        if (start >= cds.size()) {
//            return Collections.emptyList(); // Crucial for "hasMore" to work
//        }
//        return cds.subList(start, end);
//    }
//
//    public int count() {
//        return cdRepository.count();
//    }
//}