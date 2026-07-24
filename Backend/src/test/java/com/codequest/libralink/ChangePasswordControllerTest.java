package com.codequest.libralink;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChangePasswordControllerTest extends BaseApiTest {

    @Test
    void changePassword_withValidCurrent_updatesPassword() throws Exception {
        String email = uniqueEmail("changepw");
        String oldPassword = "oldpass1";
        String newPassword = "newpass1";
        String token = registerStudent(email, oldPassword);

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", oldPassword,
                                "newPassword", newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", oldPassword))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", newPassword))))
                .andExpect(status().isOk());
    }

    @Test
    void changePassword_wrongCurrent_returns400() throws Exception {
        String email = uniqueEmail("changepw-bad");
        String token = registerStudent(email, "oldpass1");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "wrongpass",
                                "newPassword", "newpass1"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password is incorrect"));
    }

    @Test
    void changePassword_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "oldpass1",
                                "newPassword", "newpass1"))))
                .andExpect(status().isUnauthorized());
    }
}
