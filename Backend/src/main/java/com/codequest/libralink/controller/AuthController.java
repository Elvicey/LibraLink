package com.codequest.libralink.controller;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.ChangePasswordRequest;
import com.codequest.libralink.dto.ForgotPasswordRequest;
import com.codequest.libralink.dto.LoginRequest;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.dto.SchoolAdminJoinRequest;
import com.codequest.libralink.dto.SchoolAdminSignupRequest;
import com.codequest.libralink.dto.ResetPasswordRequest;
import com.codequest.libralink.dto.VerifyResetCodeRequest;
import com.codequest.libralink.service.AuthService;
import com.codequest.libralink.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.AuthenticatedUser;
import com.codequest.libralink.security.Roles;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
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
            return errorResponse(e);
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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for this email, a verification code has been sent."));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        try {
            passwordResetService.verifyCode(request.getEmail(), request.getCode());
            return ResponseEntity.ok(Map.of("message", "Code verified."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(
                    request.getEmail(), request.getCode(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            Integer userId = resolveAuthenticatedUserId(authentication);
            authService.changePassword(
                    userId, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    private Integer resolveAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return principal.userId();
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
