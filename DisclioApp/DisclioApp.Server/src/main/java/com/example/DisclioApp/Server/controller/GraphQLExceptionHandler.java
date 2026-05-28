package com.example.DisclioApp.Server.controller;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.security.authentication.BadCredentialsException;

@ControllerAdvice
public class GraphQLExceptionHandler {

    @GraphQlExceptionHandler({IllegalStateException.class, IllegalArgumentException.class, BadCredentialsException.class})
    public GraphQLError handleKnownExceptions(RuntimeException ex) {
        return GraphqlErrorBuilder.newError()
                .message(ex.getMessage() == null || ex.getMessage().isBlank()
                        ? "Request could not be completed."
                        : ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(Exception.class)
    public GraphQLError handleUnexpectedExceptions(Exception ex) {
        return GraphqlErrorBuilder.newError()
                .message("An unexpected server error occurred.")
                .build();
    }
}
