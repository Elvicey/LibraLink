package com.codequest.libralink.config;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.admin.email}")
    private String adminEmail;

    @Value("${seed.admin.password}")
    private String adminPassword;

    @Value("${seed.admin.first-name}")
    private String adminFirstName;

    @Value("${seed.admin.last-name}")
    private String adminLastName;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        boolean anyAdmin = userRepository.findAll().stream()
                .anyMatch(u -> u.getRoles().stream()
                        .anyMatch(r -> "ADMIN".equals(r.getName())));

        if (anyAdmin) {
            log.info("ADMIN user already exists — skipping seed.");
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN")));

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                user -> {
                    if (user.getRoles().stream().noneMatch(r -> "ADMIN".equals(r.getName()))) {
                        user.getRoles().add(adminRole);
                        userRepository.save(user);
                        log.info("Promoted existing user [{}] to ADMIN.", adminEmail);
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setEmail(adminEmail);
                    admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                    admin.setFirstName(adminFirstName);
                    admin.setLastName(adminLastName);
                    admin.setActive(true);
                    admin.getRoles().add(adminRole);
                    userRepository.save(admin);
                    log.info("Created default ADMIN user [{}]. CHANGE THE PASSWORD IMMEDIATELY.", adminEmail);
                }
        );
    }
}
