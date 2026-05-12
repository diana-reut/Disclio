package com.example.DisclioApp.Server.model;

public class PasswordResetResponse {
    private final String message;
    private final String resetToken;

    public PasswordResetResponse(String message, String resetToken) {
        this.message = message;
        this.resetToken = resetToken;
    }

    public String getMessage() {
        return message;
    }

    public String getResetToken() {
        return resetToken;
    }
}
