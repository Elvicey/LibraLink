package com.codequest.libralink.config;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@libralink.com";
        String adminPassword = "admin123";

        System.out.println("[DATASEEDER] Running DataSeeder...");

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    System.out.println("[DATASEEDER] ADMIN role not found, creating it");
                    return roleRepository.save(new Role("ADMIN"));
                });
        System.out.println("[DATASEEDER] ADMIN role id=" + adminRole.getId());

        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        if (admin == null) {
            System.out.println("[DATASEEDER] Admin user NOT found — creating new admin");
            admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setActive(true);
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);
            User saved = userRepository.save(admin);
            System.out.println("[DATASEEDER] Admin CREATED with id=" + saved.getId() + " email=" + saved.getEmail());
        } else {
            System.out.println("[DATASEEDER] Admin user found with id=" + admin.getId() + " email=" + admin.getEmail());
            boolean matches = passwordEncoder.matches(adminPassword, admin.getPasswordHash());
            System.out.println("[DATASEEDER] passwordEncoder.matches('admin123', storedHash) = " + matches);
            if (!matches) {
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                Set<Role> roles = admin.getRoles();
                if (roles == null) roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                admin.setActive(true);
                userRepository.save(admin);
                System.out.println("[DATASEEDER] Admin password RESET for " + adminEmail);
            } else {
                System.out.println("[DATASEEDER] Admin password already correct — no change needed");
            }
        }

        long userCount = userRepository.count();
        System.out.println("[DATASEEDER] Total users in database: " + userCount);
    }
}
