package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class UserGraphQLController {
    private final UserRepository userRepository;

    public UserGraphQLController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @QueryMapping
    public User login(@Argument String username, @Argument String password) {
        System.out.println("Login attempt for: " + username);
        return userRepository.findByUsername(username)
                .filter(user -> user.getPassword().equals(password))
                .orElse(null);
    }

    @MutationMapping
    public User signup(@Argument String username, @Argument String password,
                       @Argument String firstName, @Argument String lastName,
                       @Argument String email) {
        System.out.println("Signup attempt for: " + username);
        try {
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);

            User savedUser = userRepository.save(user);
            System.out.println("User saved successfully: " + savedUser.getId());
            return savedUser;
        } catch (Exception e) {
            System.err.println("Signup error: " + e.getMessage());
            // This ensures GraphQL returns a valid error object instead of crashing the stream
            throw new RuntimeException("Could not create user: " + e.getMessage());
        }
    }
}