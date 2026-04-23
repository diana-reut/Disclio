package com.example.DisclioApp.Server.model;

public class Song {
    private int id;
    private int cdId;
    private String title;
    private String duration;
    private int trackNumber;

    public Song() {}
    public Song(int id, int cdId, String title, String duration, int trackNumber) {
        this.id = id;
        this.cdId = cdId;
        this.title = title;
        this.duration = duration;
        this.trackNumber = trackNumber;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getCdId() { return cdId; }
    public void setCdId(int cdId) { this.cdId = cdId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public int getTrackNumber() { return trackNumber; }
    public void setTrackNumber(int trackNumber) { this.trackNumber = trackNumber; }
}