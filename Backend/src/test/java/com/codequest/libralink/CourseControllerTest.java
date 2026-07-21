package com.codequest.libralink;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CourseControllerTest extends BaseApiTest {

    @Autowired
    private InstitutionRepository institutionRepository;

    private Institution testInstitution;

    @BeforeEach
    void setUp() {
        testInstitution = new Institution();
        testInstitution.setName("Test University");
        testInstitution.setTier("TIER_1");
        testInstitution.setActive(true);
        institutionRepository.save(testInstitution);
    }

    @Test
    void getCourses_byInstitution() throws Exception {
        mockMvc.perform(get("/api/courses/institutions/" + testInstitution.getInstitutionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createCourse_asLibrarian() throws Exception {
        String token = createAndGetLibrarianToken(
                uniqueEmail("courselib"), "pass1234");

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "name", "Introduction to CS",
                                        "code", "CS101",
                                        "institution", java.util.Map.of("institutionId", testInstitution.getInstitutionId())
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Introduction to CS"));
    }

    @Test
    void createCourse_asStudent_returns403() throws Exception {
        String token = registerStudent(uniqueEmail("coursestu"), "pass1234");

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "name", "Should Fail",
                                        "code", "FAIL01"
                                ))))
                .andExpect(status().isForbidden());
    }
}
