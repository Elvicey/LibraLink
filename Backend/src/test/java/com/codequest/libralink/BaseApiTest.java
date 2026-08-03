package com.codequest.libralink;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseApiTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected InstitutionRepository institutionRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected final ObjectMapper objectMapper = new ObjectMapper();

    private static int emailCounter = 0;

    private static final java.util.concurrent.atomic.AtomicInteger studentIdCounter =
            new java.util.concurrent.atomic.AtomicInteger(10_000_000);

    protected String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";
    }

    /** An 8-digit student number, unique within this test run. */
    protected String uniqueStudentId() {
        return String.valueOf(studentIdCounter.incrementAndGet());
    }

    /**
     * Every non-PLATFORM_SUPER_ADMIN user/book needs a school. Reuses the seeded admin's
     * own institution (rather than a separate "TEST" one) so existing tests that mix
     * getAdminToken()/createAndGetLibrarianToken() with createTestStudent()-created fixtures
     * interact as same-school by default; CrossSchoolIsolationTest creates its own distinct
     * second school explicitly to exercise cross-school behavior.
     */
    protected Institution testInstitution() {
        return userRepository.findByEmailIgnoreCase("admin@libralink.com")
                .map(User::getInstitution)
                .orElseGet(() -> institutionRepository.findByShortName("TEST")
                        .orElseGet(() -> institutionRepository.save(
                                new Institution("Test Institution", "TEST", "BASIC", "Accra",
                                        "test@libralink.test", "+233000000000"))));
    }

    protected User createTestStudent(String email, String password) {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseGet(() -> roleRepository.save(new Role("STUDENT")));

        User user = new User();
        user.setFirstName("Test");
        user.setLastName("Student");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.setInstitution(testInstitution());
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);
        user.setRoles(roles);
        return userRepository.save(user);
    }

    protected User createTestLibrarian(String email, String password) {
        Role librarianRole = roleRepository.findByName("LIBRARIAN")
                .orElseGet(() -> roleRepository.save(new Role("LIBRARIAN")));

        User user = new User();
        user.setFirstName("Test");
        user.setLastName("Librarian");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.setInstitution(testInstitution());
        Set<Role> roles = new HashSet<>();
        roles.add(librarianRole);
        user.setRoles(roles);
        return userRepository.save(user);
    }

    // Registration no longer returns a token directly (see AuthController.register) - it
    // now requires confirming an emailed code via /api/auth/verify-email first. Rather than
    // faking that whole round trip in every caller of this fixture helper, mark the account
    // verified directly (same shortcut PasswordResetControllerTest already takes for reset
    // codes) and log in for real - keeps this helper's contract (register a student, return
    // a working token) unchanged for its 4 existing callers.
    protected String registerStudent(String email, String password) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Test",
                                        "lastName", "Student",
                                        "email", email,
                                        "password", password,
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Registered user not found: " + email));
        user.setEmailVerified(true);
        userRepository.save(user);

        return loginAs(email, password);
    }

    protected String loginAs(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", email,
                                        "password", password
                                ))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    protected String getAdminToken() throws Exception {
        return loginAs("admin@libralink.com", "admin123");
    }

    protected String createAndGetLibrarianToken(String email, String password) throws Exception {
        createTestLibrarian(email, password);
        return loginAs(email, password);
    }

    protected String bearerToken(String token) {
        return "Bearer " + token;
    }

    // --- Multi-school test support -------------------------------------------------

    protected Institution createSchool(String name, String shortName) {
        return institutionRepository.save(new Institution(name, shortName, "BASIC", "Accra",
                shortName.toLowerCase() + "@libralink.test", "+233000000001"));
    }

    protected User createTestStudentForSchool(Institution school, String email, String password) {
        return createTestUserForSchool(school, "STUDENT", "Test", "Student", email, password);
    }

    protected User createTestLibrarianForSchool(Institution school, String email, String password) {
        return createTestUserForSchool(school, "LIBRARIAN", "Test", "Librarian", email, password);
    }

    protected User createTestSchoolAdmin(Institution school, String email, String password) {
        return createTestUserForSchool(school, "SCHOOL_ADMIN", "Test", "SchoolAdmin", email, password);
    }

    /** PLATFORM_SUPER_ADMIN is never school-scoped - no institution attached. */
    protected User createTestPlatformSuperAdmin(String email, String password) {
        Role role = roleRepository.findByName("PLATFORM_SUPER_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("PLATFORM_SUPER_ADMIN")));
        User user = new User();
        user.setFirstName("Test");
        user.setLastName("PlatformAdmin");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        return userRepository.save(user);
    }

    private User createTestUserForSchool(Institution school, String roleName, String firstName,
                                          String lastName, String email, String password) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.setInstitution(school);
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        return userRepository.save(user);
    }
}
