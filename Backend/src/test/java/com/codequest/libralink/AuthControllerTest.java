package com.codequest.libralink;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest extends BaseApiTest {

    @Test
    void register_returnsTokenAndUserInfo() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Kwame",
                                        "lastName", "Asante",
                                        "email", "kwame@test.com",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("kwame@test.com"))
                .andExpect(jsonPath("$.firstName").value("Kwame"))
                .andExpect(jsonPath("$.lastName").value("Asante"))
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "First",
                                        "lastName", "User",
                                        "email", "dup@test.com",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Second",
                                        "lastName", "User",
                                        "email", "dup@test.com",
                                        "password", "pass5678"
                                ))))
                .andExpect(status().isConflict());
    }

    @Test
    void register_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_validCredentials_returnsToken() throws Exception {
        registerStudent("login@test.com", "mypassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", "login@test.com",
                                        "password", "mypassword"
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.email").value("login@test.com"))
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")));
    }

    @Test
    void login_adminReturnsRoles() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", "admin@libralink.com",
                                        "password", "admin123"
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItem("ADMIN")));
    }

    @Test
    void registerLibrarian_asAdmin_createsWithLibrarianRole() throws Exception {
        String adminToken = getAdminToken();

        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Lib",
                                        "lastName", "Staff",
                                        "email", "lib.staff@test.com",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles", hasItem("LIBRARIAN")));
    }
}
