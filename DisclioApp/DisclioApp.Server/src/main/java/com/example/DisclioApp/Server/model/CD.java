package com.example.DisclioApp.Server.model;

import java.util.List;

public class CD {
    private int id;
    private String title;
    private String artist;
    private String category;
    private String manufacturer;
    private Integer year;
    private String condition;
    private Integer rating;
    private String description;
    private List<Song> songs;
    private List<String> photos;

    public void updateCD(CD newCD){
        this.title = newCD.title;
        this.artist = newCD.artist;
        this.category = newCD.category;
        this.manufacturer = newCD.manufacturer;
        this.year = newCD.year;
        this.condition = newCD.condition;
        this.rating = newCD.rating;
        this.description = newCD.description;
        this.songs = newCD.songs;
        this.photos = newCD.photos;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getArtist() {
        return artist;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Song> getSongs() { return songs; }
    public void setSongs(List<Song> songs) { this.songs = songs; }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    @Override
    public String toString() {
        return "CD{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", artist='" + artist + '\'' +
                ", category='" + category + '\'' +
                ", manufacturer='" + manufacturer + '\'' +
                ", year=" + year +
                ", condition='" + condition + '\'' +
                ", rating=" + rating +
                ", description='" + description + '\'' +
                ", songs=" + songs +
                ", photos=" + photos +
                '}';
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
}
