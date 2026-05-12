package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;

public interface TotpOperations {
    String generateSecret();
    String buildOtpAuthUri(User user, String secret);
    boolean verifyCode(String secret, String code);
}
