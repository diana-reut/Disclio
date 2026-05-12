package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.User;

public interface WebAuthnOperations {
    String startPasskeyRegistration(User user, String rpId, String origin);
    boolean finishPasskeyRegistration(User user, String rpId, String origin, String credentialJson);
    String startAuthentication(User user, String ceremonyId, String rpId, String origin);
    void finishAuthentication(User user, String ceremonyId, String rpId, String origin, String credentialJson);
    boolean hasCredentials(User user);
    int countCredentials(User user);
}
