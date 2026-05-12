package com.example.DisclioApp.Server.config;

import com.example.DisclioApp.Server.model.Permission;
import com.example.DisclioApp.Server.model.Role;
import com.example.DisclioApp.Server.repository.PermissionRepository;
import com.example.DisclioApp.Server.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class SecurityBootstrap {
    private static final List<String> USER_PERMISSIONS = List.of(
            "READ_CD",
            "VIEW_STATISTICS",
            "CREATE_CD",
            "UPDATE_CD",
            "DELETE_CD",
            "CREATE_SONG",
            "DELETE_SONG"
    );

    private static final List<String> ADMIN_ONLY_PERMISSIONS = List.of(
            "START_GENERATOR",
            "STOP_GENERATOR",
            "VIEW_LOG"
    );

    @Bean
    CommandLineRunner seedSecurityData(PermissionRepository permissionRepository, RoleRepository roleRepository) {
        return args -> {
            Set<Permission> userPermissions = new LinkedHashSet<>();
            for (String permissionName : USER_PERMISSIONS) {
                userPermissions.add(permissionRepository.findByName(permissionName)
                        .orElseGet(() -> {
                            Permission permission = new Permission();
                            permission.setName(permissionName);
                            return permissionRepository.save(permission);
                        }));
            }

            Set<Permission> adminPermissions = new LinkedHashSet<>(userPermissions);
            for (String permissionName : ADMIN_ONLY_PERMISSIONS) {
                adminPermissions.add(permissionRepository.findByName(permissionName)
                        .orElseGet(() -> {
                            Permission permission = new Permission();
                            permission.setName(permissionName);
                            return permissionRepository.save(permission);
                        }));
            }

            Role userRole = roleRepository.findByName("USER").orElseGet(() -> new Role("USER"));
            userRole.setPermissions(userPermissions);
            roleRepository.save(userRole);

            Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> new Role("ADMIN"));
            adminRole.setPermissions(adminPermissions);
            roleRepository.save(adminRole);
        };
    }
}
