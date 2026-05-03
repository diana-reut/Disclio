package com.example.DisclioApp.Server.controller;

import com.example.DisclioApp.Server.model.ChatMessage;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class UserGraphQLController {
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public UserGraphQLController(UserRepository userRepository, MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
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

    @QueryMapping
    public boolean userExists(@Argument String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    @QueryMapping
    public List<ChatMessage> getChatHistory(@Argument String user1, @Argument String user2) {
        // This looks for messages between these two people in NoSQL
        return mongoTemplate.find(
                Query.query(new Criteria().orOperator(
                        Criteria.where("sender").is(user1).and("recipient").is(user2),
                        Criteria.where("sender").is(user2).and("recipient").is(user1)
                )).with(Sort.by(Sort.Direction.ASC, "timestamp")),
                ChatMessage.class
        );
    }

}