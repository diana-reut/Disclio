package com.example.DisclioApp.Server.model;

public class EmailLoginCodeResponse {
    private final String message;

    public EmailLoginCodeResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
