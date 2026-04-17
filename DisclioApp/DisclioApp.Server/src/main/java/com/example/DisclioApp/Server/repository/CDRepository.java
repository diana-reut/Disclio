package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.CD;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class CDRepository {
    private final List<CD> cdStorage = new ArrayList<>();

    public void save(CD cd) {
        cdStorage.add(cd);
        System.out.println("added new CD: " + cd.toString());
    }

    public List<CD> findAll() {
        System.out.println("called the findAll method from the repository");
        return new ArrayList<>(cdStorage);
    }

    public Optional<CD> findByIndex(int i) {
        System.out.println("called the findByIndex method from the repository for i=" + i);
        if (i < 0 || i >= cdStorage.size()) {
            return Optional.empty();
        }
        return Optional.of(cdStorage.get(i));
    }

    public Optional<CD> deleteCD(int i) {
        System.out.println("called the deleteCD method from the repository for i=" + i);
        if (i < 0 || i >= cdStorage.size()) {
            return Optional.empty();
        }
        return Optional.of(cdStorage.remove(i));
    }

    public Optional<CD> update(int i, CD updatedCd) {
        System.out.println("called the update method from the repository for i=" + i);
        if (i < 0 || i >= cdStorage.size()) {
            return Optional.empty();
        }

        cdStorage.set(i, updatedCd);
        return Optional.of(updatedCd);
    }

    public int count() {
        return cdStorage.size();
    }
}
