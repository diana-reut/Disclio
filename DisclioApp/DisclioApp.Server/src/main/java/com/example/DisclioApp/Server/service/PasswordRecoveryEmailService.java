package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.config.AuthProperties;
import com.example.DisclioApp.Server.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordRecoveryEmailService implements PasswordRecoveryNotifier {
    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;
    private final String fromAddress;

    public PasswordRecoveryEmailService(
            JavaMailSender mailSender,
            AuthProperties authProperties,
            @Value("${app.mail.from:${spring.mail.username:}}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.authProperties = authProperties;
        this.fromAddress = fromAddress;
    }

    @Override
    public void sendPasswordResetToken(User user, String rawToken) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setTo(user.getEmail());
        message.setSubject("Disclio password reset");
        message.setText("""
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
        ));

        mailSender.send(message);
    }
}
