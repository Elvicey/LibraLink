package com.codequest.libralink;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sweep of the Roles.STAFF-gated endpoints confirming non-staff roles are rejected, plus
 * the new platform-only boundary (school creation) rejecting ordinary staff.
 */
class RoleBoundaryTest extends BaseApiTest {

    @Test
    void student_cannotListAllUsers() throws Exception {
        var student = createTestStudent(uniqueEmail("rbstu"), "pass1234");
        String token = loginAs(student.getEmail(), "pass1234");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void student_cannotCreateBook() throws Exception {
        var student = createTestStudent(uniqueEmail("rbstu2"), "pass1234");
        String token = loginAs(student.getEmail(), "pass1234");

        mockMvc.perform(post("/api/books")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(token))
                        .content("{\"title\":\"Should Not Save\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void librarian_cannotCreateSchool() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("rblib"), "pass1234");

        mockMvc.perform(post("/api/institutions")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content("{\"name\":\"Rogue School\",\"shortName\":\"ROGUE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_cannotCreateSchool() throws Exception {
        String adminToken = getAdminToken();

        mockMvc.perform(post("/api/institutions")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(adminToken))
                        .content("{\"name\":\"Rogue School 2\",\"shortName\":\"ROGUE2\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticated_cannotListUsers() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }
}
