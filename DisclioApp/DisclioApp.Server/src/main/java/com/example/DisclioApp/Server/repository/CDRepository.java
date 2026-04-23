package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.CD;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class CDRepository {
    private final List<CD> cdStorage = new ArrayList<>();
    int id = 1;

    public void save(CD cd) {
        cd.setId(id);
        id = id + 1;
        cdStorage.add(cd);
        System.out.println("added new CD: " + cd.getTitle());
    }

    public List<CD> findAll() {
        System.out.println("called the findAll method from the repository");
        return new ArrayList<>(cdStorage);
    }

    public Optional<CD> findById(int id) {
        System.out.println("called the findById method from the repository for i=" + id);
        for (var e : cdStorage) {
            if (e.getId() == id)
                return Optional.of(e);
        }
        return Optional.empty();
    }

    public Optional<CD> deleteCD(int id) {
        System.out.println("called the deleteCD method from the repository for i=" + id);
        for (var e : cdStorage) {
            if (e.getId() == id){
                cdStorage.remove(e);
                return Optional.of(e);
            }
        }
        return Optional.empty();
    }

    public Optional<CD> update(int id, CD updatedCd) {
        System.out.println("called the update method from the repository for i=" + id);
        for (var e : cdStorage) {
            if (e.getId() == id){
                e.updateCD(updatedCd);
                return Optional.of(e);
            }
        }
        return Optional.empty();
    }

    public int count() {
        return cdStorage.size();
    }
}
