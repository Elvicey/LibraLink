package com.codequest.libralink;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SchoolAdminSignupTest extends BaseApiTest {

    private String issueSchoolCode(String shortName) throws Exception {
        String platformEmail = uniqueEmail("platform");
        createTestPlatformSuperAdmin(platformEmail, "pass1234");
        String platformToken = loginAs(platformEmail, "pass1234");

        MvcResult result = mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Signup Test School", "shortName", shortName))))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("schoolCode").asText();
    }

    @Test
    void signup_withValidUnusedSchoolCode_createsSchoolAdmin() throws Exception {
        String code = issueSchoolCode("VALID" + System.nanoTime() % 100000);
        String email = uniqueEmail("newschooladmin");

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", code,
                                        "firstName", "New",
                                        "lastName", "Admin",
                                        "email", email,
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.roles", hasItem("SCHOOL_ADMIN")))
                .andExpect(jsonPath("$.schoolId").isNumber());
    }

    @Test
    void signup_withAlreadyUsedSchoolCode_rejected() throws Exception {
        String code = issueSchoolCode("USED" + System.nanoTime() % 100000);

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", code,
                                        "firstName", "First",
                                        "lastName", "Admin",
                                        "email", uniqueEmail("first"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", code,
                                        "firstName", "Second",
                                        "lastName", "Admin",
                                        "email", uniqueEmail("second"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signup_withInvalidCode_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", "NOTREAL1",
                                        "firstName", "Nope",
                                        "lastName", "Admin",
                                        "email", uniqueEmail("nope"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signup_duplicateEmail_returns409() throws Exception {
        String code1 = issueSchoolCode("DUP1-" + System.nanoTime() % 100000);
        String code2 = issueSchoolCode("DUP2-" + System.nanoTime() % 100000);
        String email = uniqueEmail("dupschooladmin");

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", code1,
                                        "firstName", "First",
                                        "lastName", "Admin",
                                        "email", email,
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", code2,
                                        "firstName", "Second",
                                        "lastName", "Admin",
                                        "email", email,
                                        "password", "pass5678"
                                ))))
                .andExpect(status().isConflict());
    }

    @Test
    void signup_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"schoolCode\":\"SOMECODE\"}"))
                .andExpect(status().isBadRequest());
    }
}
