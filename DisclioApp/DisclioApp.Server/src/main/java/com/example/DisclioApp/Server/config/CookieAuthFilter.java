package com.example.DisclioApp.Server.config;

import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.service.AuthService;
import com.example.DisclioApp.Server.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Component
public class CookieAuthFilter extends OncePerRequestFilter {

    private final AuthService authService;
    private final JwtService jwtService;

    public CookieAuthFilter(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getCookies() != null) {
            String accessToken = Arrays.stream(request.getCookies())
                    .filter(c -> AuthService.ACCESS_TOKEN_COOKIE.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (accessToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<User> userOptional = authService.resolveAuthenticatedUser(accessToken, response);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    Claims claims = jwtService.parse(accessToken);
                    String roleName = claims.get("role", String.class);

                    if (roleName != null && !roleName.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
                    } else if (user.getRole() != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
                    }

                    Object permissionsClaim = claims.get("permissions");
                    if (permissionsClaim instanceof List<?> permissions) {
                        permissions.stream()
                                .filter(String.class::isInstance)
                                .map(String.class::cast)
                                .flatMap(permission -> permission == null ? Stream.empty() : Stream.of(permission))
                                .forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission)));
                    } else if (user.getRole() != null) {
                        user.getRole().getPermissions()
                                .forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission.getName())));
                    }

                    UsernamePasswordAuthenticationToken badge = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(badge);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
