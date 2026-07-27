package com.codequest.libralink;

import com.codequest.libralink.entity.Institution;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SchoolAdminInviteTest extends BaseApiTest {

    private Institution school;
    private String schoolAdminToken;

    private void setUpSchoolAdmin() throws Exception {
        school = createSchool("Invite Test School", "INV" + System.nanoTime() % 100000);
        String email = uniqueEmail("inviter");
        createTestSchoolAdmin(school, email, "pass1234");
        schoolAdminToken = loginAs(email, "pass1234");
    }

    @Test
    void invite_asSchoolAdmin_createsOtp() throws Exception {
        setUpSchoolAdmin();

        mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", uniqueEmail("invitee")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.otp").isString())
                .andExpect(jsonPath("$.otp", not(emptyString())));
    }

    @Test
    void invite_asLibrarian_returns403() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("invlib"), "pass1234");

        mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", uniqueEmail("invitee2")))))
                .andExpect(status().isForbidden());
    }

    @Test
    void invite_rateLimited_after5InHour() throws Exception {
        setUpSchoolAdmin();

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/school-admins/invite")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Authorization", bearerToken(schoolAdminToken))
                            .content(objectMapper.writeValueAsString(
                                    java.util.Map.of("email", uniqueEmail("bulk" + i)))))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", uniqueEmail("bulk6")))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Too many")));
    }

    @Test
    void join_withValidOtp_createsSchoolAdmin() throws Exception {
        setUpSchoolAdmin();
        String joinEmail = uniqueEmail("joiner");

        MvcResult inviteResult = mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", joinEmail))))
                .andExpect(status().isCreated())
                .andReturn();
        String otp = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("otp").asText();

        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", joinEmail,
                                        "otp", otp,
                                        "firstName", "Joined",
                                        "lastName", "Admin",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles", hasItem("SCHOOL_ADMIN")))
                .andExpect(jsonPath("$.schoolId").value(school.getInstitutionId()));
    }

    @Test
    void join_withWrongEmail_returns400() throws Exception {
        setUpSchoolAdmin();
        String joinEmail = uniqueEmail("joiner2");

        MvcResult inviteResult = mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", joinEmail))))
                .andExpect(status().isCreated())
                .andReturn();
        String otp = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("otp").asText();

        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", uniqueEmail("differentperson"),
                                        "otp", otp,
                                        "firstName", "Wrong",
                                        "lastName", "Email",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void join_withWrongOtp_returns400() throws Exception {
        setUpSchoolAdmin();
        String joinEmail = uniqueEmail("joiner3");

        mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", joinEmail))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", joinEmail,
                                        "otp", "000000",
                                        "firstName", "Wrong",
                                        "lastName", "Otp",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void join_withAlreadyUsedOtp_returns400() throws Exception {
        setUpSchoolAdmin();
        String joinEmail = uniqueEmail("joiner4");

        MvcResult inviteResult = mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(schoolAdminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", joinEmail))))
                .andExpect(status().isCreated())
                .andReturn();
        String otp = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("otp").asText();

        java.util.Map<String, String> joinBody = java.util.Map.of(
                "email", joinEmail,
                "otp", otp,
                "firstName", "First",
                "lastName", "Use",
                "password", "pass1234"
        );
        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinBody)))
                .andExpect(status().isCreated());

        // Reused OTP, but a DIFFERENT email this time, to isolate "OTP already used" from
        // the (also-true, but separately tested) "email already exists" failure mode.
        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", uniqueEmail("reused-otp"),
                                        "otp", otp,
                                        "firstName", "Second",
                                        "lastName", "Use",
                                        "password", "pass5678"
                                ))))
                .andExpect(status().isBadRequest());
    }
}
