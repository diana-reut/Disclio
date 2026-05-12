package com.example.DisclioApp.Server.model;

public class ThreeWayLoginStartResponse {
    private final String message;
    private final String pendingLoginId;

    public ThreeWayLoginStartResponse(String message, String pendingLoginId) {
        this.message = message;
        this.pendingLoginId = pendingLoginId;
    }

    public String getMessage() {
        return message;
    }

    public String getPendingLoginId() {
        return pendingLoginId;
    }
}
