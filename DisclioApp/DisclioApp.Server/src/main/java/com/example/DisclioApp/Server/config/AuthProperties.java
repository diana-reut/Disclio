package com.example.DisclioApp.Server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {
    private String jwtSecret;
    private long accessTokenMinutes;
    private long inactivityTimeoutMinutes;
    private boolean secureCookies;
    private String sameSite;

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public long getAccessTokenMinutes() {
        return accessTokenMinutes;
    }

    public void setAccessTokenMinutes(long accessTokenMinutes) {
        this.accessTokenMinutes = accessTokenMinutes;
    }

    public long getInactivityTimeoutMinutes() {
        return inactivityTimeoutMinutes;
    }

    public void setInactivityTimeoutMinutes(long inactivityTimeoutMinutes) {
        this.inactivityTimeoutMinutes = inactivityTimeoutMinutes;
    }

    public boolean isSecureCookies() {
        return secureCookies;
    }

    public void setSecureCookies(boolean secureCookies) {
        this.secureCookies = secureCookies;
    }

    public String getSameSite() {
        return sameSite;
    }

    public void setSameSite(String sameSite) {
        this.sameSite = sameSite;
    }
}
