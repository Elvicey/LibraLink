package com.codequest.libralink;

import com.codequest.libralink.entity.Institution;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Closes the "school suspension is stored but never enforced" known gap: PATCH
 * /api/schools/{id} flipping status to SUSPENDED previously had zero runtime effect.
 * Covers both enforcement points added - SchoolSuspensionFilter (every authenticated
 * request) and AuthService's explicit checks in login/school-admin-join/school-admin-signup
 * (permitAll endpoints the filter never reaches, since there's no JWT yet at that point).
 */
class SchoolSuspensionEnforcementTest extends BaseApiTest {

    private String platformToken() throws Exception {
        String email = uniqueEmail("platform");
        createTestPlatformSuperAdmin(email, "pass1234");
        return loginAs(email, "pass1234");
    }

    private void suspendSchool(String platformToken, Integer schoolId) throws Exception {
        mockMvc.perform(patch("/api/schools/" + schoolId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk());
    }

    private void reactivateSchool(String platformToken, Integer schoolId) throws Exception {
        mockMvc.perform(patch("/api/schools/" + schoolId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void suspendedSchool_existingTokenGets403OnNextRequest() throws Exception {
        Institution school = createSchool("Suspend Enforce School", "SUSE" + System.nanoTime() % 100000);
        String librarianEmail = uniqueEmail("suselib");
        createTestLibrarianForSchool(school, librarianEmail, "pass1234");
        String librarianToken = loginAs(librarianEmail, "pass1234");
        String platformToken = platformToken();

        // Token works fine while the school is active.
        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk());

        suspendSchool(platformToken, school.getInstitutionId());

        // Same, already-issued token now gets rejected on the very next request.
        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void suspendedSchool_loginBlocked() throws Exception {
        Institution school = createSchool("Login Block School", "LGB" + System.nanoTime() % 100000);
        String email = uniqueEmail("loginblock");
        createTestStudentForSchool(school, email, "pass1234");
        String platformToken = platformToken();

        suspendSchool(platformToken, school.getInstitutionId());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", "pass1234"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendedSchool_schoolAdminJoinBlocked() throws Exception {
        Institution school = createSchool("Join Block School", "JNB" + System.nanoTime() % 100000);
        String adminEmail = uniqueEmail("joinblockadmin");
        createTestSchoolAdmin(school, adminEmail, "pass1234");
        String adminToken = loginAs(adminEmail, "pass1234");
        String platformToken = platformToken();

        String joinEmail = uniqueEmail("joinblockjoiner");
        MvcResult inviteResult = mockMvc.perform(post("/api/school-admins/invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", joinEmail))))
                .andExpect(status().isCreated())
                .andReturn();
        String otp = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("otp").asText();

        suspendSchool(platformToken, school.getInstitutionId());

        mockMvc.perform(post("/api/auth/school-admin-join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", joinEmail,
                                        "otp", otp,
                                        "firstName", "Blocked",
                                        "lastName", "Join",
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendedSchool_schoolAdminSignupBlocked() throws Exception {
        String platformToken = platformToken();
        String shortName = "SGB" + System.nanoTime() % 100000;

        MvcResult createResult = mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Signup Block School", "shortName", shortName))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String schoolCode = created.get("schoolCode").asText();
        Integer schoolId = created.get("schoolId").asInt();

        suspendSchool(platformToken, schoolId);

        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", schoolCode,
                                        "firstName", "Blocked",
                                        "lastName", "Signup",
                                        "email", uniqueEmail("signupblock"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void platformSuperAdmin_unaffectedBySchoolSuspension() throws Exception {
        Institution school = createSchool("Platform Unaffected School", "PFU" + System.nanoTime() % 100000);
        String platformToken = platformToken();

        suspendSchool(platformToken, school.getInstitutionId());

        // Platform admin's own requests (schoolId == null in their token) are never blocked -
        // including managing the very school that's now suspended.
        mockMvc.perform(get("/api/schools")
                        .header("Authorization", bearerToken(platformToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + school.getInstitutionId() + ")].status", hasItem("SUSPENDED")));
    }

    @Test
    void reactivatedSchool_requestsSucceedAgain() throws Exception {
        Institution school = createSchool("Reactivate School", "REAC" + System.nanoTime() % 100000);
        String librarianEmail = uniqueEmail("reaclib");
        createTestLibrarianForSchool(school, librarianEmail, "pass1234");
        String librarianToken = loginAs(librarianEmail, "pass1234");
        String platformToken = platformToken();

        suspendSchool(platformToken, school.getInstitutionId());
        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isForbidden());

        reactivateSchool(platformToken, school.getInstitutionId());
        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk());
    }
}
