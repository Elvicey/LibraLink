package com.codequest.libralink;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SchoolControllerTest extends BaseApiTest {

    private String platformToken() throws Exception {
        String email = uniqueEmail("platform");
        createTestPlatformSuperAdmin(email, "pass1234");
        return loginAs(email, "pass1234");
    }

    @Test
    void createSchool_asPlatformAdmin_returnsSchoolCodeOnce() throws Exception {
        mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "name", "New School " + System.nanoTime(),
                                        "shortName", "NS" + System.nanoTime() % 100000
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.schoolId").isNumber())
                .andExpect(jsonPath("$.schoolCode").isString())
                .andExpect(jsonPath("$.schoolCode", not(emptyString())))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createSchool_asRegularAdmin_returns403() throws Exception {
        String adminToken = getAdminToken();

        mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Rogue School", "shortName", "ROGUE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void createSchool_asLibrarian_returns403() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("schlib"), "pass1234");

        mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Rogue School 2", "shortName", "ROGUE2"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void listSchools_returnsStatsPerSchool() throws Exception {
        String token = platformToken();
        String shortName = "STAT" + System.nanoTime() % 100000;

        mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Stats School", "shortName", shortName))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/schools")
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].shortName", hasItem(shortName)))
                .andExpect(jsonPath("$[?(@.shortName == '" + shortName + "')].schoolCodePending", hasItem(true)))
                .andExpect(jsonPath("$[?(@.shortName == '" + shortName + "')].userCount", hasItem(0)));
    }

    @Test
    void regenerateSchoolCode_invalidatesOldCode() throws Exception {
        String token = platformToken();
        String shortName = "REGEN" + System.nanoTime() % 100000;

        MvcResult createResult = mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Regen School", "shortName", shortName))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String oldCode = created.get("schoolCode").asText();
        Integer schoolId = created.get("schoolId").asInt();

        MvcResult regenResult = mockMvc.perform(patch("/api/schools/" + schoolId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content("{\"regenerateCode\":true}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode regenerated = objectMapper.readTree(regenResult.getResponse().getContentAsString());
        String newCode = regenerated.get("schoolCode").asText();
        org.junit.jupiter.api.Assertions.assertNotEquals(oldCode, newCode);

        // Old code should no longer work for signup.
        mockMvc.perform(post("/api/auth/school-admin-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "schoolCode", oldCode,
                                        "firstName", "A",
                                        "lastName", "B",
                                        "email", uniqueEmail("regenfail"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void suspendAndReactivateSchool_updatesStatus() throws Exception {
        String token = platformToken();
        String shortName = "SUSP" + System.nanoTime() % 100000;

        MvcResult createResult = mockMvc.perform(post("/api/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Suspend School", "shortName", shortName))))
                .andExpect(status().isCreated())
                .andReturn();
        Integer schoolId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("schoolId").asInt();

        mockMvc.perform(patch("/api/schools/" + schoolId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        mockMvc.perform(patch("/api/schools/" + schoolId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void updateSchool_notFound_returns404() throws Exception {
        mockMvc.perform(patch("/api/schools/999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken()))
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isNotFound());
    }
}
