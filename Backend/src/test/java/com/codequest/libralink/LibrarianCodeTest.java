package com.codequest.libralink;

import com.codequest.libralink.entity.Institution;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LibrarianCodeTest extends BaseApiTest {

    @Test
    void issueLibrarianCode_asSchoolAdmin_succeeds() throws Exception {
        Institution school = createSchool("Code Test School", "CODE" + System.nanoTime() % 100000);
        String email = uniqueEmail("codeadmin");
        createTestSchoolAdmin(school, email, "pass1234");
        String token = loginAs(email, "pass1234");

        mockMvc.perform(post("/api/librarian-codes")
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.librarianCode").isString())
                .andExpect(jsonPath("$.librarianCode", not(emptyString())));
    }

    @Test
    void issueLibrarianCode_asLibrarian_returns403() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("codelib"), "pass1234");

        mockMvc.perform(post("/api/librarian-codes")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void registerLibrarian_withValidCodeFromOwnSchool_succeeds() throws Exception {
        Institution school = createSchool("Own School", "OWN" + System.nanoTime() % 100000);
        String adminEmail = uniqueEmail("ownadmin");
        createTestSchoolAdmin(school, adminEmail, "pass1234");
        String adminToken = loginAs(adminEmail, "pass1234");

        MvcResult codeResult = mockMvc.perform(post("/api/librarian-codes")
                        .header("Authorization", bearerToken(adminToken)))
                .andExpect(status().isCreated())
                .andReturn();
        String code = objectMapper.readTree(codeResult.getResponse().getContentAsString())
                .get("librarianCode").asText();

        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "New",
                                        "lastName", "Librarian",
                                        "email", uniqueEmail("newlib"),
                                        "password", "pass1234",
                                        "librarianCode", code
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles", hasItem("LIBRARIAN")))
                .andExpect(jsonPath("$.schoolId").value(school.getInstitutionId()));
    }

    @Test
    void registerLibrarian_withCodeFromOtherSchool_rejected() throws Exception {
        Institution schoolA = createSchool("School A Code", "SACODE" + System.nanoTime() % 100000);
        Institution schoolB = createSchool("School B Code", "SBCODE" + System.nanoTime() % 100000);

        String adminAEmail = uniqueEmail("admina");
        createTestSchoolAdmin(schoolA, adminAEmail, "pass1234");
        String adminAToken = loginAs(adminAEmail, "pass1234");

        String adminBEmail = uniqueEmail("adminb");
        createTestSchoolAdmin(schoolB, adminBEmail, "pass1234");
        String adminBToken = loginAs(adminBEmail, "pass1234");

        // Code issued for School B...
        MvcResult codeResult = mockMvc.perform(post("/api/librarian-codes")
                        .header("Authorization", bearerToken(adminBToken)))
                .andExpect(status().isCreated())
                .andReturn();
        String codeForB = objectMapper.readTree(codeResult.getResponse().getContentAsString())
                .get("librarianCode").asText();

        // ...used by School A's admin registering a librarian - must be rejected.
        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminAToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Cross",
                                        "lastName", "School",
                                        "email", uniqueEmail("crossschool"),
                                        "password", "pass1234",
                                        "librarianCode", codeForB
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerLibrarian_withUnknownCode_returns400() throws Exception {
        String adminToken = getAdminToken();

        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Bad",
                                        "lastName", "Code",
                                        "email", uniqueEmail("badcode"),
                                        "password", "pass1234",
                                        "librarianCode", "NOTREAL1"
                                ))))
                .andExpect(status().isBadRequest());
    }
}
