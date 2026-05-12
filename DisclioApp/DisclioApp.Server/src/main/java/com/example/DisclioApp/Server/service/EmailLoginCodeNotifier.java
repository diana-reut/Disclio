package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;

public interface EmailLoginCodeNotifier {
    void sendEmailLoginCode(User user, String rawCode);
}
