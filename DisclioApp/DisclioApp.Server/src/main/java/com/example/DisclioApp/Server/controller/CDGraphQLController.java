package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.service.CDService;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class CDGraphQLController {

    private final CDService cdService;

    public CDGraphQLController(CDService cdService) {
        this.cdService = cdService;
    }

    // ----------- QUERIES -----------

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
        Map<Integer, Long> map = cdService.getRatingDistribution();

        return map.entrySet()
                .stream()
                .map(e -> new RatingStat(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    // ----------- MUTATIONS -----------

    @MutationMapping
    public String addCD(
            @Argument String title,
            @Argument String artist,
            @Argument String category,
            @Argument String manufacturer,
            @Argument Integer year,
            @Argument String condition,
            @Argument Integer rating,
            @Argument String description,
            @Argument List<String> songs,
            @Argument List<String> photos
    ) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist(artist);
        cd.setCategory(category);
        cd.setManufacturer(manufacturer);
        cd.setYear(year);
        cd.setCondition(condition);
        cd.setRating(rating);
        cd.setDescription(description);
        cd.setSongs(songs);
        cd.setPhotos(photos);

        cdService.addCD(cd);
        return "CD added successfully!";
    }

    @MutationMapping
    public String deleteCD(@Argument int id) {
        CD deleted = cdService.deleteCD(id);
        return deleted != null ? "Deleted" : "Not found";
    }

    @MutationMapping
    public CD updateCD(
            @Argument int id,
            @Argument String title,
            @Argument String artist,
            @Argument String category,
            @Argument String manufacturer,
            @Argument Integer year,
            @Argument String condition,
            @Argument Integer rating,
            @Argument String description,
            @Argument List<String> songs,
            @Argument List<String> photos
    ) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist(artist);
        cd.setCategory(category);
        cd.setManufacturer(manufacturer);
        cd.setYear(year);
        cd.setCondition(condition);
        cd.setRating(rating);
        cd.setDescription(description);
        cd.setSongs(songs);
        cd.setPhotos(photos);

        return cdService.updateCD(id, cd);
    }
}
