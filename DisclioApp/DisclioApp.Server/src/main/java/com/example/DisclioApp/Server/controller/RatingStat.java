package com.example.DisclioApp.Server.controller;

public class RatingStat {
    private int rating;
    private long count;

    public RatingStat(int rating, long count) {
        this.rating = rating;
        this.count = count;
    }

    public int getRating() { return rating; }
    public long getCount() { return count; }
}
