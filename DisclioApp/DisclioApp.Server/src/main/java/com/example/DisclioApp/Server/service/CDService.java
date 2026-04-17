package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.repository.CDRepository;
import org.springframework.stereotype.Service;
import java.util.List;

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

    public CD getCDByIndex(int i) {
        return cdRepository.findByIndex(i).orElse(null);
    }

    public CD deleteCD(int i) {
        return cdRepository.deleteCD(i).orElse(null);
    }

    public CD updateCD(int i, CD updatedCd) {
        return cdRepository.update(i, updatedCd).orElse(null);
    }
}