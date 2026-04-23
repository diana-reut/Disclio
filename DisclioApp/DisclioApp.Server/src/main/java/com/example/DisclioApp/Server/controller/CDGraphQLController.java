package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.model.Song;
import com.example.DisclioApp.Server.service.CDService;
import com.example.DisclioApp.Server.service.SongService;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class CDGraphQLController {

    private final CDService cdService;
    private final SongService songService;

    public CDGraphQLController(CDService cdService, SongService songService) {
        this.cdService = cdService;
        this.songService = songService;
    }

    /**
     * DataFetcher for the 'songs' field.
     * This is the heart of the 1-to-many relationship.
     */
    @SchemaMapping(typeName = "CD", field = "songs")
    public List<Song> songs(CD cd) {
        return songService.getSongsByCd(cd.getId());
    }


    @QueryMapping
    public List<CD> cds() {
        return cdService.getAllCDs();
    }

    @QueryMapping
    public CD cd(@Argument int id) {
        return cdService.getCDByIndex(id);
    }

    @QueryMapping
    public List<CD> pagedCds(@Argument int page, @Argument int size) {
        return cdService.getPagedCDs(page, size);
    }

    @QueryMapping
    public int totalCount() {
        return cdService.count();
    }

    @QueryMapping
    public List<RatingStat> ratingStats() {
        return cdService.getRatingDistribution().entrySet().stream()
                .map(e -> new RatingStat(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    @QueryMapping
    public List<SongFrequencyStat> songFrequencyStats() {
        return songService.getCdCountBySongFrequency().entrySet().stream()
                .map(e -> new SongFrequencyStat(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    @MutationMapping
    public String addCD(
            @Argument String title, @Argument String artist,
            @Argument String category, @Argument String manufacturer,
            @Argument Integer year, @Argument String condition,
            @Argument Integer rating, @Argument String description,
            @Argument List<Map<String, Object>> songs,
            @Argument List<String> photos
    ) {
        CD cd = createCDFromArgs(title, artist, category, manufacturer, year, condition, rating, description, photos);
        cdService.addCD(cd);

        handleSongUpdate(cd.getId(), songs);
        System.out.println("CD and " + (songs != null ? songs.size() : 0) + " songs added successfully!");
        return "CD and " + (songs != null ? songs.size() : 0) + " songs added successfully!";
    }

    @MutationMapping
    public CD updateCD(
            @Argument int id,
            @Argument String title, @Argument String artist,
            @Argument String category, @Argument String manufacturer,
            @Argument Integer year, @Argument String condition,
            @Argument Integer rating, @Argument String description,
            @Argument List<Map<String, Object>> songs, // FIXED: Changed from List<Song> to List<Map>
            @Argument List<String> photos
    ) {
        CD cdUpdate = createCDFromArgs(title, artist, category, manufacturer, year, condition, rating, description, photos);
        CD result = cdService.updateCD(id, cdUpdate);

        if (result != null) {
            // Update the 'Many' side: clear old songs and add new ones
            songService.deleteSongsByCd(id);
            handleSongUpdate(id, songs);
        }

        return result;
    }

    @MutationMapping
    public String deleteCD(@Argument int id) {
        CD deleted = cdService.deleteCD(id);
        return deleted != null ? "Deleted" : "Not found";
    }

    @MutationMapping
    public Song addSong(
            @Argument Integer id,
            @Argument int cdId,
            @Argument String title,
            @Argument String duration,
            @Argument Integer trackNumber
    ) {
        Song song = new Song();

        if (id != null) {
            song.setId(id);
        }

        song.setCdId(cdId);
        song.setTitle(title);
        song.setDuration(duration);
        song.setTrackNumber(trackNumber != null ? trackNumber : 0);

        return songService.addSong(song);
    }

    @MutationMapping
    public boolean deleteSong(@Argument int id) {
        return songService.deleteSong(id);
    }

    private CD createCDFromArgs(String title, String artist, String category, String manufacturer,
                                Integer year, String condition, Integer rating, String description, List<String> photos) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist(artist);
        cd.setCategory(category);
        cd.setManufacturer(manufacturer);
        cd.setYear(year);
        cd.setCondition(condition);
        cd.setRating(rating);
        cd.setDescription(description);
        cd.setPhotos(photos);
        return cd;
    }

    private void handleSongUpdate(int cdId, List<Map<String, Object>> songMaps) {
        if (songMaps != null) {
            for (Map<String, Object> map : songMaps) {
                Song song = new Song();
                song.setCdId(cdId);
                song.setTitle((String) map.get("title"));
                song.setDuration((String) map.get("duration"));
                song.setTrackNumber(map.get("trackNumber") != null ? (Integer) map.get("trackNumber") : 0);
                songService.addSong(song);
            }
        }
    }

    @QueryMapping
    public List<Song> songsByCd(@Argument int cdId) {
        System.out.println(songService.getSongsByCd(cdId));
        return songService.getSongsByCd(cdId);
    }
}