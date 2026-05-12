package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;

public interface PasswordRecoveryNotifier {
    void sendPasswordResetToken(User user, String rawToken);
}
