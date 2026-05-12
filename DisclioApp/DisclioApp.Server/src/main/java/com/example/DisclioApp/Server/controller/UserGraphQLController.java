package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.ChatMessage;
import com.example.DisclioApp.Server.model.EmailLoginCodeResponse;
import com.example.DisclioApp.Server.model.PasswordResetResponse;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.UserRepository;
import com.example.DisclioApp.Server.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.Arrays;
import java.util.List;

@Controller
public class UserGraphQLController {
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;
    private final AuthService authService;

    public UserGraphQLController(MongoTemplate mongoTemplate, UserRepository userRepository, AuthService authService) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @MutationMapping
    public User signup(@Argument String username, @Argument String password,
                       @Argument String firstName, @Argument String lastName,
                       @Argument String email) {
        return authService.register(username, password, firstName, lastName, email);
    }

    @MutationMapping
    public User login(@Argument String username, @Argument String password) {
        return authService.authenticate(username, password);
    }

    @MutationMapping
    public EmailLoginCodeResponse requestEmailLoginCode(@Argument String identifier) {
        return authService.requestEmailLoginCode(identifier);
    }

    @MutationMapping
    public User loginWithEmailCode(@Argument String identifier, @Argument String code) {
        return authService.authenticateWithEmailCode(identifier, code);
    }

    @MutationMapping
    public PasswordResetResponse requestPasswordReset(@Argument String identifier) {
        return authService.requestPasswordReset(identifier);
    }

    @MutationMapping
    public boolean resetPassword(@Argument String token, @Argument String newPassword) {
        return authService.resetPassword(token, newPassword);
    }

    @MutationMapping
    public boolean logout() {
        authService.logout();
        return true;
    }

    @QueryMapping
    public User me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return userRepository.findByUsername(user.getUsername()).orElse(null);
    }

    @QueryMapping
    public boolean userExists(@Argument String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<ChatMessage> getChatHistory(@Argument String user1, @Argument String user2) {
        return mongoTemplate.find(
                Query.query(new Criteria().orOperator(
                        Criteria.where("sender").is(user1).and("recipient").is(user2),
                        Criteria.where("sender").is(user2).and("recipient").is(user1)
                )).with(Sort.by(Sort.Direction.ASC, "timestamp")),
                ChatMessage.class
        );
    }
}
