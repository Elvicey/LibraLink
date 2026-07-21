package com.codequest.libralink;

import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecurityFilterChainTest extends BaseApiTest {

    @Test
    void publicEndpoints_accessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/authors"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/publishers"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/courses/institutions/1"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/institutions"))
                .andExpect(status().isOk());
    }

    @Test
    void authEndpoints_accessibleWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"x@x.com\",\"password\":\"x\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("{\"firstName\":\"A\",\"lastName\":\"B\",\"email\":\"x@x.com\",\"password\":\"x\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void protectedEndpoints_requireAuth() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/borrow-records"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/books")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void librarianEndpoints_forbidStudents() throws Exception {
        String studentToken = registerStudent(uniqueEmail("secstu"), "pass1234");

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken(studentToken))
                        .contentType("application/json")
                        .content("{\"title\":\"X\",\"totalCopies\":1,\"availableCopies\":1}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearerToken(studentToken))
                        .contentType("application/json")
                        .content("{\"userId\":1,\"type\":\"T\",\"title\":\"T\",\"message\":\"M\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/borrow-records")
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{invalid json"))
                .andExpect(status().isBadRequest());
    }
}
