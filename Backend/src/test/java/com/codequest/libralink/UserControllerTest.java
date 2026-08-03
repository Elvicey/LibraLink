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
    private User testStudent;
    private String studentToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = getAdminToken();
        testStudent = createTestStudent(uniqueEmail("user"), "pass1234");
        studentToken = loginAs(testStudent.getEmail(), "pass1234");
    }

    @Test
    void createUser_asAdmin_setsPasswordThatCanLogIn() throws Exception {
        // Regression: passwordHash used to have @JsonIgnore directly on the field, which
        // blocks deserialization as well as serialization - every POST /api/users request
        // silently lost its password and failed "password is required" no matter what the
        // body sent. If that regresses, the login below will 401 instead of succeeding.
        String email = uniqueEmail("newstaffuser");
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "firstName", "New",
                                "lastName", "User",
                                "email", email,
                                "passwordHash", "pass1234",
                                "institution", java.util.Map.of("institutionId", testInstitution().getInstitutionId())))))
                .andExpect(status().isCreated());

        loginAs(email, "pass1234");
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
                                java.util.Map.of("role", "LIBRARIAN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")))
                .andExpect(jsonPath("$.roles", hasItem("LIBRARIAN")));
    }

    @Test
    void assignRole_lecturer_rejected() throws Exception {
        mockMvc.perform(post("/api/users/" + testStudent.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("role", "LECTURER"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lecturer role is no longer supported"));
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
    void updateProfile_persistsStudentDetails() throws Exception {
        mockMvc.perform(put("/api/users/" + testStudent.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "phoneNumber", "0244000000",
                                "studentId", "12345678",
                                "indexNumber", "1234567",
                                "programme", "BSc Computer Science"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value("12345678"))
                .andExpect(jsonPath("$.indexNumber").value("1234567"))
                .andExpect(jsonPath("$.programme").value("BSc Computer Science"))
                .andExpect(jsonPath("$.phoneNumber").value("0244000000"));
    }

    @Test
    void updateProfile_rejectsBadStudentId() throws Exception {
        mockMvc.perform(put("/api/users/" + testStudent.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("studentId", "1234567"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Student ID must be 8 digits."));
    }

    @Test
    void updateProfile_rejectsBadIndexNumber() throws Exception {
        mockMvc.perform(put("/api/users/" + testStudent.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("indexNumber", "12345678"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Index number must be 7 digits."));
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
}
