package com.example.DisclioApp.Server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "songs")
public class Song {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cd_id", nullable = false)
    private CD cd; // This is the actual relationship link

    private String title;
    private String duration;
    private int trackNumber;

    public Song() {}

    // Updated Constructor: Pass the CD object instead of an int
    public Song(int id, CD cd, String title, String duration, int trackNumber) {
        this.id = id;
        this.cd = cd;
        this.title = title;
        this.duration = duration;
        this.trackNumber = trackNumber;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    // Helper method to get the ID specifically (useful for GraphQL/Frontend)
    public int getCdId() {
        return cd != null ? cd.getId() : 0;
    }

    public CD getCd() { return cd; }
    public void setCd(CD cd) { this.cd = cd; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public int getTrackNumber() { return trackNumber; }
    public void setTrackNumber(int trackNumber) { this.trackNumber = trackNumber; }
}