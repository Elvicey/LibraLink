package com.codequest.libralink;

import com.codequest.libralink.entity.EmailVerificationCode;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.EmailVerificationCodeRepository;
import com.codequest.libralink.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest extends BaseApiTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationCodeRepository verificationCodeRepository;

    @Test
    void register_returnsNoTokenUntilEmailIsVerified() throws Exception {
        // Registration now only signals that a code was sent - it must not issue a token,
        // and the account must be unusable (login blocked) until verify-email confirms it.
        String email = "kwame@test.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Kwame",
                                        "lastName", "Asante",
                                        "email", email,
                                        "password", "pass1234",
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.email").value(email));

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertTrue(!user.isEmailVerified(), "newly self-registered student must start unverified");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", "pass1234"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsStringIgnoringCase("verify")));
    }

    @Test
    void verifyEmail_withValidCode_verifiesAndReturnsToken() throws Exception {
        String email = uniqueEmail("verifyme");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Verify",
                                        "lastName", "Me",
                                        "email", email,
                                        "password", "pass1234",
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isCreated());

        // A real code was already emailed (or logged, with no BREVO_API_KEY in tests) by
        // register() itself - insert a known one directly, same shortcut
        // PasswordResetControllerTest takes for reset codes, since the stored value is
        // hashed and can't be read back from the response.
        String code = "135791";
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCodeHash(passwordEncoder.encode(code));
        verificationCode.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        verificationCode.setUsed(false);
        verificationCode.setCreatedAt(Instant.now());
        verificationCodeRepository.save(verificationCode);

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")));

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertTrue(user.isEmailVerified());

        // Login now works too, since the account is verified.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", "pass1234"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void verifyEmail_wrongCode_returns400() throws Exception {
        String email = uniqueEmail("wrongcode");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Wrong",
                                        "lastName", "Code",
                                        "email", email,
                                        "password", "pass1234",
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "code", "000000"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerification_unknownEmail_returnsGenericSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", "nosuchaccount@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private Integer createSchoolWithDomain(String domain) {
        Institution school = createSchool("Domain School " + System.nanoTime(), "DOMSCH" + System.nanoTime() % 100000);
        school.setEmailDomain(domain);
        institutionRepository.save(school);
        return school.getInstitutionId();
    }

    /** A unique local-part with no domain, for building an email at a specific test domain
     *  (uniqueEmail() already appends "@test.com", so it can't be reused here). */
    private String uniqueLocalPart(String prefix) {
        return prefix + "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    private java.util.Map<String, Object> registerBody(String email, Integer institutionId) {
        return java.util.Map.of(
                "firstName", "Domain",
                "lastName", "Test",
                "email", email,
                "password", "pass1234",
                "studentId", uniqueStudentId(),
                "institutionId", institutionId
        );
    }

    @Test
    void register_withMatchingEmailDomain_succeeds() throws Exception {
        Integer schoolId = createSchoolWithDomain("knust.edu.gh");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                registerBody(uniqueLocalPart("student") + "@knust.edu.gh", schoolId))))
                .andExpect(status().isCreated());
    }

    @Test
    void register_withNonMatchingEmailDomain_returns400() throws Exception {
        Integer schoolId = createSchoolWithDomain("knust.edu.gh");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                registerBody(uniqueLocalPart("student") + "@gmail.com", schoolId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsStringIgnoringCase("email")));
    }

    @Test
    void register_domainMatchIsCaseInsensitive() throws Exception {
        Integer schoolId = createSchoolWithDomain("knust.edu.gh");
        String email = "Student." + System.nanoTime() + "@KNUST.EDU.GH";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody(email, schoolId))))
                .andExpect(status().isCreated());
    }

    @Test
    void register_schoolWithNoDomainConfigured_allowsAnyEmail() throws Exception {
        Institution school = createSchool("Open School " + System.nanoTime(), "OPEN" + System.nanoTime() % 100000);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                registerBody(uniqueLocalPart("student") + "@gmail.com", school.getInstitutionId()))))
                .andExpect(status().isCreated());
    }

    @Test
    void register_subdomainConfigured_onlyExactSuffixMatches() throws Exception {
        Integer schoolId = createSchoolWithDomain("st.knust.edu.gh");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                registerBody(uniqueLocalPart("student") + "@knust.edu.gh", schoolId))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                registerBody(uniqueLocalPart("student") + "@st.knust.edu.gh", schoolId))))
                .andExpect(status().isCreated());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "First",
                                        "lastName", "User",
                                        "email", "dup@test.com",
                                        "password", "pass1234",
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Second",
                                        "lastName", "User",
                                        "email", "dup@test.com",
                                        "password", "pass5678",
                                        "studentId", uniqueStudentId()
                                ))))
                .andExpect(status().isConflict());
    }

    @Test
    void register_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_missingStudentId_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "No",
                                        "lastName", "StudentId",
                                        "email", uniqueEmail("nostudentid"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_invalidStudentIdFormat_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Bad",
                                        "lastName", "Format",
                                        "email", uniqueEmail("badformat"),
                                        "password", "pass1234",
                                        "studentId", "12"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateStudentId_returns409() throws Exception {
        String studentId = uniqueStudentId();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "First",
                                        "lastName", "Owner",
                                        "email", uniqueEmail("sid1"),
                                        "password", "pass1234",
                                        "studentId", studentId
                                ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Second",
                                        "lastName", "Claimant",
                                        "email", uniqueEmail("sid2"),
                                        "password", "pass1234",
                                        "studentId", studentId
                                ))))
                .andExpect(status().isConflict());
    }

    @Test
    void login_validCredentials_returnsToken() throws Exception {
        registerStudent("login@test.com", "mypassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", "login@test.com",
                                        "password", "mypassword"
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.email").value("login@test.com"))
                .andExpect(jsonPath("$.roles", hasItem("STUDENT")));
    }

    @Test
    void login_adminReturnsRoles() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", "admin@libralink.com",
                                        "password", "admin123"
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItem("ADMIN")));
    }

    @Test
    void registerLibrarian_asAdmin_createsWithLibrarianRole() throws Exception {
        String adminToken = getAdminToken();

        MvcResult codeResult = mockMvc.perform(post("/api/librarian-codes")
                        .header("Authorization", bearerToken(adminToken)))
                .andExpect(status().isCreated())
                .andReturn();
        String librarianCode = objectMapper.readTree(codeResult.getResponse().getContentAsString())
                .get("librarianCode").asText();

        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Lib",
                                        "lastName", "Staff",
                                        "email", uniqueEmail("lib.staff"),
                                        "password", "pass1234",
                                        "librarianCode", librarianCode
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles", hasItem("LIBRARIAN")));
    }

    @Test
    void registerLibrarian_missingCode_returns400() throws Exception {
        String adminToken = getAdminToken();

        mockMvc.perform(post("/api/auth/register-librarian")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "No",
                                        "lastName", "Code",
                                        "email", uniqueEmail("nocode"),
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_schoolAdminReturnsSchoolId() throws Exception {
        Institution school = createSchool("Auth Test School", "AUTHTEST-" + System.nanoTime());
        String email = uniqueEmail("schooladmin");
        createTestSchoolAdmin(school, email, "pass1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "email", email,
                                        "password", "pass1234"
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItem("SCHOOL_ADMIN")))
                .andExpect(jsonPath("$.schoolId").value(school.getInstitutionId()));
    }
}
