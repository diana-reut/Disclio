package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.Song;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class SongRepository {
    private final List<Song> songStorage = new ArrayList<>();
    private int nextId = 1;

    public Song save(Song song) {
        if (song.getId() == 0) {
            song.setId(nextId++);
            songStorage.add(song);
            System.out.println("Added new song" + song.getTitle() + " for cs with id = " + song.getCdId());
        } else {
            //update
            for (int i = 0; i < songStorage.size(); i++) {
                if (songStorage.get(i).getId() == song.getId()) {
                    songStorage.set(i, song);
                    System.out.println("Updated song " + song.getTitle());
                    break;
                }
            }
        }
        return song;
    }

    public boolean deleteById(int id) {
        System.out.println("deleted song with id = " + id);
        return songStorage.removeIf(s -> s.getId() == id);
    }

    public void deleteByCdId(int cdId) {
        System.out.println("Deleted songs for cd " + cdId);
        songStorage.removeIf(s -> s.getCdId() == cdId);
    }

    public List<Song> findByCdId(int cdId) {
        return songStorage.stream()
                .filter(s -> s.getCdId() == cdId)
                .collect(Collectors.toList());
    }

    public List<Song> findAll() {
        return new ArrayList<>(songStorage);
    }
}