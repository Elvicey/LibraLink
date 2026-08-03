package com.codequest.libralink;

import com.codequest.libralink.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MetadataControllerTest extends BaseApiTest {

    @Autowired
    private CategoryRepository categoryRepository;

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

    @Test
    void createCategory_duplicateName_returnsExistingRowInsteadOfDuplicating() throws Exception {
        // Categories have no schoolId - they're one shared taxonomy every school's staff
        // can add to via the Web book form's inline "+ New category" button. Without
        // find-or-create semantics, two callers naming the same category (even with
        // different case/whitespace) would each mint their own row.
        String token = createAndGetLibrarianToken(uniqueEmail("catdup"), "pass1234");
        String name = "Fantasy-" + System.nanoTime();

        var first = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("name", name))))
                .andExpect(status().isCreated())
                .andReturn();
        int firstId = objectMapper.readTree(first.getResponse().getContentAsString()).get("id").asInt();

        var second = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("name", "  " + name.toUpperCase() + "  "))))
                .andReturn();
        int secondId = objectMapper.readTree(second.getResponse().getContentAsString()).get("id").asInt();

        assertEquals(firstId, secondId);
        long matching = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(name))
                .count();
        assertEquals(1, matching);
    }
}
