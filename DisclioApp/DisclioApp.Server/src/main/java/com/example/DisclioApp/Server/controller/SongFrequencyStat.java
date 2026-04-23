package com.example.DisclioApp.Server.controller;

public class SongFrequencyStat {
    private int songCount;
    private long numberOfCds;

    public SongFrequencyStat(int songCount, long numberOfCds) {
        this.songCount = songCount;
        this.numberOfCds = numberOfCds;
    }

    public int getSongCount() { return songCount; }
    public long getNumberOfCds() { return numberOfCds; }
}