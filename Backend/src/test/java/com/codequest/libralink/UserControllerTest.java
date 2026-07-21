package com.codequest.libralink;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTest extends BaseApiTest {

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String studentToken;
    private User testStudent;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = getAdminToken();
        testStudent = createTestStudent(uniqueEmail("user"), "pass1234");
        studentToken = loginAs(testStudent.getEmail(), "pass1234");
    }

    @Test
    void getAllUsers_asAdmin() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void getUserById_found() throws Exception {
        mockMvc.perform(get("/api/users/" + testStudent.getId())
                        .header("Authorization", bearerToken(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testStudent.getEmail()))
                .andExpect(jsonPath("$.firstName").value("Test"));
    }

    @Test
    void getUserById_notFound() throws Exception {
        mockMvc.perform(get("/api/users/99999")
                        .header("Authorization", bearerToken(adminToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void assignRole_asAdmin() throws Exception {
        mockMvc.perform(post("/api/users/" + testStudent.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("role", "LECTURER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")))
                .andExpect(jsonPath("$.roles", hasItem("LECTURER")));
    }

    @Test
    void assignRole_asStudent_returns403() throws Exception {
        User anotherStudent = createTestStudent(uniqueEmail("otherstu"), "pass1234");
        String otherToken = loginAs(anotherStudent.getEmail(), "pass1234");

        mockMvc.perform(post("/api/users/" + anotherStudent.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(otherToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("role", "ADMIN"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void assignRole_missingRole_returns400() throws Exception {
        mockMvc.perform(post("/api/users/" + testStudent.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatePushToken() throws Exception {
        mockMvc.perform(put("/api/users/" + testStudent.getId() + "/push-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("pushToken", "ExpoPushToken[abc123]"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Push token updated"));
    }

    @Test
    void getAllUsers_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }
}
