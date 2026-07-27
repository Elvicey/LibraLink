package com.codequest.libralink;

import com.codequest.libralink.entity.PasswordResetCode;
import com.codequest.libralink.repository.PasswordResetCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PasswordResetControllerTest extends BaseApiTest {

    @Autowired
    private PasswordResetCodeRepository resetCodeRepository;

    @Test
    void forgotPassword_unknownEmail_returnsGenericSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", "missing@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void verifyAndResetPassword_withValidCode_updatesPassword() throws Exception {
        String email = uniqueEmail("reset");
        String oldPassword = "oldpass1";
        String newPassword = "newpass1";
        registerStudent(email, oldPassword);

        String code = "654321";
        PasswordResetCode resetCode = new PasswordResetCode();
        resetCode.setEmail(email);
        resetCode.setCodeHash(passwordEncoder.encode(code));
        resetCode.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        resetCode.setUsed(false);
        resetCode.setCreatedAt(Instant.now());
        resetCodeRepository.save(resetCode);

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Code verified."));

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", email,
                                        "code", code,
                                        "newPassword", newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", oldPassword))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void verifyResetCode_invalidCode_returns400() throws Exception {
        String email = uniqueEmail("badcode");
        registerStudent(email, "pass1234");

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "code", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired verification code"));
    }
}
