package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.config.AuthProperties;
import com.example.DisclioApp.Server.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {
    private final AuthProperties authProperties;
    private final SecretKey secretKey;

    public JwtService(AuthProperties authProperties) {
        this.authProperties = authProperties;
        this.secretKey = buildSecretKey(authProperties.getJwtSecret());
    }

    public String generateAccessToken(User user, String sessionId, List<String> permissions) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(authProperties.getAccessTokenMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claims(Map.of(
                        "sessionId", sessionId,
                        "role", user.getRole().getName(),
                        "permissions", permissions
                ))
                .signWith(secretKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey buildSecretKey(String rawSecret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(rawSecret);
            return Keys.hmacShaKeyFor(decoded);
        } catch (IllegalArgumentException ignored) {
            byte[] bytes = rawSecret.getBytes(StandardCharsets.UTF_8);
            if (bytes.length < 32) {
                throw new IllegalStateException("app.auth.jwt-secret must be at least 32 bytes or valid Base64.");
            }
            return Keys.hmacShaKeyFor(bytes);
        }
    }
}
