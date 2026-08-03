package com.codequest.libralink;

import com.codequest.libralink.entity.Author;
import com.codequest.libralink.entity.Category;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.Publisher;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.repository.AuthorRepository;
import com.codequest.libralink.repository.CategoryRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.PublisherRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for the Group 5 input-validation/mass-assignment remediation (H6, H7):
 * - H7: create endpoints must never trust a client-supplied id, since JPA save() on an
 *   entity with an existing id performs an UPDATE/merge instead of an INSERT, which would
 *   otherwise let a client silently overwrite an unrelated existing row.
 * - H6: request bodies missing clearly-required fields must fail with a clean 400 instead
 *   of corrupting data or surfacing as an unhandled 500.
 */
class Group5ValidationMassAssignmentTest extends BaseApiTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private PublisherRepository publisherRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    private String librarianToken;

    private String librarian() throws Exception {
        if (librarianToken == null) {
            librarianToken = createAndGetLibrarianToken(uniqueEmail("g5lib"), "pass1234");
        }
        return librarianToken;
    }

    private String platformAdminToken;

    // Institution creation is PLATFORM_SUPER_ADMIN-only (see InstitutionController) - a
    // Librarian creating untracked schools with no code/validation was the exact hole that
    // restriction closed, so this mass-assignment check needs a role that's actually allowed.
    private String platformAdmin() throws Exception {
        if (platformAdminToken == null) {
            String email = uniqueEmail("g5platform");
            createTestPlatformSuperAdmin(email, "pass1234");
            platformAdminToken = loginAs(email, "pass1234");
        }
        return platformAdminToken;
    }

    // --- H7: forged id on create must never overwrite an existing row ---

    @Test
    void createCategory_withForgedIdOfExistingRow_createsNewRowInstead() throws Exception {
        Category victim = categoryRepository.save(new Category("Original Category", "keep me", null));

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "id", victim.getId(),
                                        "name", "Hijacked Category"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(victim.getId())))
                .andExpect(jsonPath("$.name").value("Hijacked Category"));

        Category reloaded = categoryRepository.findById(victim.getId()).orElseThrow();
        assertEqualsIgnoreCase("Original Category", reloaded.getName());
    }

    @Test
    void createAuthor_withForgedIdOfExistingRow_createsNewRowInstead() throws Exception {
        Author victim = authorRepository.save(new Author("Original Author", "bio"));

        mockMvc.perform(post("/api/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "id", victim.getId(),
                                        "fullName", "Hijacked Author"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(victim.getId())));

        Author reloaded = authorRepository.findById(victim.getId()).orElseThrow();
        assertEqualsIgnoreCase("Original Author", reloaded.getFullName());
    }

    @Test
    void createPublisher_withForgedIdOfExistingRow_createsNewRowInstead() throws Exception {
        Publisher victim = publisherRepository.save(new Publisher("Original Publisher", "Ghana"));

        mockMvc.perform(post("/api/publishers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "id", victim.getId(),
                                        "name", "Hijacked Publisher"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(victim.getId())));

        Publisher reloaded = publisherRepository.findById(victim.getId()).orElseThrow();
        assertEqualsIgnoreCase("Original Publisher", reloaded.getName());
    }

    @Test
    void createInstitution_withForgedIdOfExistingRow_createsNewRowInstead() throws Exception {
        Institution victim = institutionRepository.save(
                new Institution("Original Institution", "OI", "BASIC", "Accra", "orig@inst.com", "0000"));

        mockMvc.perform(post("/api/institutions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformAdmin()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "institutionId", victim.getInstitutionId(),
                                        "name", "Hijacked Institution",
                                        "tier", "BASIC"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.institutionId").value(org.hamcrest.Matchers.not(victim.getInstitutionId())));

        Institution reloaded = institutionRepository.findById(victim.getInstitutionId()).orElseThrow();
        assertEqualsIgnoreCase("Original Institution", reloaded.getName());
    }

    @Test
    void createRole_withForgedIdOfExistingRole_cannotRenameAdminRole() throws Exception {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN")));

        mockMvc.perform(post("/api/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "id", adminRole.getId(),
                                        "name", "HIJACKED_ROLE"
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(adminRole.getId())));

        Role reloaded = roleRepository.findById(adminRole.getId()).orElseThrow();
        assertEqualsIgnoreCase("ADMIN", reloaded.getName());
    }

    // --- H6: missing required fields must fail cleanly with 400, not corrupt/500 ---

    @Test
    void createCategory_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("name", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name", notNullValue()));
    }

    @Test
    void createCategory_missingName_returns400() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAuthor_blankFullName_returns400() throws Exception {
        mockMvc.perform(post("/api/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("fullName", ""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createInstitution_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/institutions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "name", "Valid Name",
                                        "email", "not-an-email"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createNotification_missingMessage_returns400() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", 1,
                                        "type", "GENERAL",
                                        "title", "Missing message"
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("message")));
    }

    @Test
    void issueFine_missingAmount_returns400() throws Exception {
        var student = createTestStudent(uniqueEmail("g5fine"), "pass1234");

        mockMvc.perform(post("/api/fines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("userId", student.getId()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("amount")));
    }

    // --- H7 follow-on: AudioBookTrackController.createTrack was missing an authorization
    // check entirely (any authenticated user could inject catalog entries) ---

    @Test
    void createAudioTrack_asStudent_returns403() throws Exception {
        var student = createTestStudent(uniqueEmail("g5audio"), "pass1234");
        String studentToken = loginAs(student.getEmail(), "pass1234");

        mockMvc.perform(post("/api/audio-tracks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Forged Track",
                                        "audioUrl", "https://example.com/audio.mp3"
                                ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void createAudioTrack_asLibrarian_isAllowed() throws Exception {
        mockMvc.perform(post("/api/audio-tracks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarian()))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Legit Track",
                                        "audioUrl", "https://example.com/audio.mp3",
                                        "durationSeconds", 120,
                                        "fileSizeBytes", 1.5
                                ))))
                .andExpect(status().isCreated());
    }

    private static void assertEqualsIgnoreCase(String expected, String actual) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, actual);
    }
}
