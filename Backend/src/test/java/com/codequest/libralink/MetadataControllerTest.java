package com.codequest.libralink;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MetadataControllerTest extends BaseApiTest {

    @Test
    void getAllAuthors() throws Exception {
        mockMvc.perform(get("/api/authors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createAuthor_asLibrarian() throws Exception {
        String token = createAndGetLibrarianToken(
                uniqueEmail("authorlib"), "pass1234");

        mockMvc.perform(post("/api/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("fullName", "Chinua Achebe"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName").value("Chinua Achebe"));
    }

    @Test
    void getAllPublishers() throws Exception {
        mockMvc.perform(get("/api/publishers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createPublisher_asLibrarian() throws Exception {
        String token = createAndGetLibrarianToken(
                uniqueEmail("publib"), "pass1234");

        mockMvc.perform(post("/api/publishers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Penguin Books"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Penguin Books"));
    }

    @Test
    void getAllCategories() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createCategory_asLibrarian() throws Exception {
        String token = createAndGetLibrarianToken(
                uniqueEmail("catlib"), "pass1234");

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "Fiction"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Fiction"));
    }
}
