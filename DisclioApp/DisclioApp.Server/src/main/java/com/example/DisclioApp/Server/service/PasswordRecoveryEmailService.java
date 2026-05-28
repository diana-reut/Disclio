package com.example.DisclioApp.Server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.DisclioApp.Server.config.AuthProperties;
import com.example.DisclioApp.Server.model.User;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class PasswordRecoveryEmailService implements PasswordRecoveryNotifier, EmailLoginCodeNotifier {
    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;
    private final String fromAddress;
    private final String fromName;
    private final String brevoApiKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PasswordRecoveryEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            AuthProperties authProperties,
            ObjectMapper objectMapper,
            @Value("${app.mail.from:${spring.mail.username:}}") String fromAddress,
            @Value("${app.mail.from-name:Disclio}") String fromName,
            @Value("${app.mail.brevo.api-key:}") String brevoApiKey
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.authProperties = authProperties;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.brevoApiKey = brevoApiKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void sendPasswordResetToken(User user, String rawToken) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        String subject = "Disclio password reset";
        String body = """
                Hello %s,

                We received a request to reset your password.

                Your recovery token is:
                %s

                This token expires in %d minutes.
                If you did not request this, you can ignore this email.
                """.formatted(
                user.getFirstName() != null && !user.getFirstName().isBlank() ? user.getFirstName() : user.getUsername(),
                rawToken,
                authProperties.getPasswordResetTokenMinutes()
        );

        sendEmail(user.getEmail(), subject, body);
    }

    @Override
    public void sendEmailLoginCode(User user, String rawCode) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        String subject = "Disclio login code";
        String body = """
                Hello %s,

                Here is your one-time login code:
                %s

                This code expires in %d minutes and can only be used once.
                If you did not request this, you can ignore this email.
                """.formatted(
                user.getFirstName() != null && !user.getFirstName().isBlank() ? user.getFirstName() : user.getUsername(),
                rawCode,
                authProperties.getEmailLoginCodeMinutes()
        );

        sendEmail(user.getEmail(), subject, body);
    }

    private void sendEmail(String recipient, String subject, String body) {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendWithBrevo(recipient, subject, body);
            return;
        }

        if (mailSender == null) {
            throw new IllegalStateException("Email delivery is not configured on the server.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    private void sendWithBrevo(String recipient, String subject, String body) {
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new IllegalStateException("APP_MAIL_FROM must be set when using Brevo.");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "sender", Map.of(
                            "name", fromName == null || fromName.isBlank() ? "Disclio" : fromName,
                            "email", fromAddress
                    ),
                    "to", List.of(Map.of("email", recipient)),
                    "subject", subject,
                    "textContent", body
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Brevo email request failed with status " + response.statusCode() + ".");
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Brevo email delivery failed.", ex);
        }
    }
}
