package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.Song;
import com.example.DisclioApp.Server.repository.SongRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SongService {
    private final SongRepository songRepository;

    public SongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }


    public Song addSong(Song song) {
        return songRepository.save(song);
    }

    public List<Song> getSongsByCd(int cdId) {
        return songRepository.findByCdId(cdId);
    }

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public boolean deleteSong(int id) {
        return songRepository.deleteById(id);
    }

    public void deleteSongsByCd(int cdId) {
        songRepository.deleteByCdId(cdId);
    }

    /**
     * Stats: Returns a map where:
     * Key = Number of songs (e.g., "10 songs")
     * Value = Number of CDs that have that many songs (e.g., "5 CDs")
     */
    public Map<Integer, Long> getCdCountBySongFrequency() {
        Map<Integer, Integer> songCountPerCd = songRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        Song::getCdId,
                        Collectors.summingInt(e -> 1)
                ));

        return songCountPerCd.values().stream()
                .collect(Collectors.groupingBy(
                        count -> count,
                        Collectors.counting()
                ));
    }
}