package com.example.DisclioApp.Server.config;

import com.example.DisclioApp.Server.model.Permission;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.repository.UserRepository;
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

@Component
public class CookieAuthFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public CookieAuthFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getCookies() != null) {
            String username = Arrays.stream(request.getCookies())
                    .filter(c -> "username".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByUsername(username).orElse(null);

                if (user != null && user.getRole() != null) {

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                    authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));

                    for (Permission permission : user.getRole().getPermissions()) {
                        authorities.add(new SimpleGrantedAuthority(permission.getName()));
                    }

                    UsernamePasswordAuthenticationToken badge = new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
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