package com.codequest.libralink.controller;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.LoginRequest;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.dto.SchoolAdminJoinRequest;
import com.codequest.libralink.dto.SchoolAdminSignupRequest;
import com.codequest.libralink.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.Roles;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            String message = e.getMessage() != null ? e.getMessage() : "";
            int status = message.toLowerCase().contains("suspended") ? 403 : 401;
            return ResponseEntity.status(status).body(Map.of("error", message));
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

    @PreAuthorize(Roles.STAFF)
    @PostMapping("/register-librarian")
    public ResponseEntity<?> registerLibrarian(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.registerLibrarian(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return errorResponse(e);
        }
    }

    /** Public - gated entirely by possession of a valid, unused school_code. */
    @PostMapping("/school-admin-signup")
    public ResponseEntity<?> schoolAdminSignup(@Valid @RequestBody SchoolAdminSignupRequest request) {
        try {
            AuthResponse response = authService.schoolAdminSignup(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return errorResponse(e);
        }
    }

    /** Public - gated entirely by possession of a valid, unused, email-matched OTP. */
    @PostMapping("/school-admin-join")
    public ResponseEntity<?> schoolAdminJoin(@Valid @RequestBody SchoolAdminJoinRequest request) {
        try {
            AuthResponse response = authService.schoolAdminJoin(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return errorResponse(e);
        }
    }

    private ResponseEntity<?> errorResponse(IllegalArgumentException e) {
        String message = e.getMessage() != null ? e.getMessage() : "";
        String lower = message.toLowerCase();
        int status = lower.contains("suspended") ? 403 : lower.contains("already exists") ? 409 : 400;
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
