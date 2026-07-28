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
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("{\"firstName\":\"A\",\"lastName\":\"B\",\"email\":\"x@x.com\",\"password\":\"x\",\"studentId\":\"" + uniqueStudentId() + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{invalid json"))
                .andExpect(status().isBadRequest());
    }
}
