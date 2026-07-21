package com.codequest.libralink.controller;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.LoginRequest;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AuthController(AuthService authService, UserRepository userRepository, RoleRepository roleRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/debug/db-status")
    public ResponseEntity<?> debugDbStatus() {
        long userCount = userRepository.count();
        var adminUser = userRepository.findByEmail("admin@libralink.com");
        var allRoles = roleRepository.findAll();
        return ResponseEntity.ok(Map.of(
            "totalUsers", userCount,
            "adminExists", adminUser.isPresent(),
            "adminEmail", adminUser.map(u -> u.getEmail()).orElse("NOT FOUND"),
            "adminId", adminUser.map(u -> u.getId()).orElse(null),
            "adminActive", adminUser.map(u -> u.isActive()).orElse(false),
            "adminRoles", adminUser.map(u -> u.getRoles().stream().map(r -> r.getName()).toList()).orElse(java.util.List.of()),
            "allRoles", allRoles.stream().map(r -> r.getName()).toList()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/register-librarian")
    public ResponseEntity<?> registerLibrarian(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.registerLibrarian(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/register-lecturer")
    public ResponseEntity<?> registerLecturer(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.registerLecturer(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }
}
