package com.codequest.libralink;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Confirms the handful of real actions wired up to AuditLogService actually write a row -
 * the Platform Super Admin's Audit Log viewer is only useful if something populates it.
 */
class AuditLoggingTest extends BaseApiTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void login_writesAuditLogEntry() throws Exception {
        User student = createTestStudent(uniqueEmail("auditlogin"), "pass1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", student.getEmail(), "password", "pass1234"))))
                .andExpect(status().isOk());

        var logs = auditLogRepository.findByUserId(student.getId());
        assertTrue(logs.stream().anyMatch(l -> "LOGIN".equals(l.getAction())),
                "expected a LOGIN entry for the logged-in user");
    }

    @Test
    void assignRole_writesAuditLogEntry() throws Exception {
        String adminToken = getAdminToken();
        User student = createTestStudent(uniqueEmail("auditrole"), "pass1234");

        mockMvc.perform(post("/api/users/" + student.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(adminToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("role", "LIBRARIAN"))))
                .andExpect(status().isOk());

        var logs = auditLogRepository.findByEntityTypeAndEntityId("USER", student.getId());
        assertTrue(logs.stream().anyMatch(l -> "ROLE_GRANTED".equals(l.getAction())),
                "expected a ROLE_GRANTED entry for the target user");
    }

    @Test
    void payFine_writesAuditLogEntry() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("auditfinelib"), "pass1234");
        User student = createTestStudent(uniqueEmail("auditfinestu"), "pass1234");

        MvcResult fineResult = mockMvc.perform(post("/api/fines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "userId", student.getId(),
                                "amount", new BigDecimal("5.00"),
                                "reason", "Audit log test fine"))))
                .andExpect(status().isCreated())
                .andReturn();
        Integer fineId = objectMapper.readTree(fineResult.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "fineId", fineId,
                                "userId", student.getId(),
                                "amountPaid", new BigDecimal("5.00"),
                                "paymentMethod", "CASH"))))
                .andExpect(status().isCreated());

        var logs = auditLogRepository.findByEntityTypeAndEntityId("FINE", fineId);
        assertTrue(logs.stream().anyMatch(l -> "FINE_PAID".equals(l.getAction())),
                "expected a FINE_PAID entry for the paid fine");
    }

    @Test
    void createAndUpdateBook_writeAuditLogEntries() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("auditbooklib"), "pass1234");

        MvcResult createResult = mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "title", "Audit Log Test Book",
                                "subtitle", "A Test Subtitle",
                                "isbn", "978-0-00-000000-" + (System.nanoTime() % 10),
                                "totalCopies", 1,
                                "availableCopies", 1,
                                "language", "English",
                                "isActive", true))))
                .andExpect(status().isCreated())
                .andReturn();
        Integer bookId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asInt();

        var createLogs = auditLogRepository.findByEntityTypeAndEntityId("BOOK", bookId);
        assertTrue(createLogs.stream().anyMatch(l -> "BOOK_CREATED".equals(l.getAction())),
                "expected a BOOK_CREATED entry");

        mockMvc.perform(put("/api/books/" + bookId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "title", "Audit Log Test Book (Updated)",
                                "subtitle", "A Test Subtitle",
                                "isbn", "978-0-00-000000-" + (System.nanoTime() % 10),
                                "totalCopies", 1,
                                "availableCopies", 1,
                                "language", "English",
                                "isActive", true))))
                .andExpect(status().isOk());

        var updateLogs = auditLogRepository.findByEntityTypeAndEntityId("BOOK", bookId);
        assertTrue(updateLogs.stream().anyMatch(l -> "BOOK_UPDATED".equals(l.getAction())),
                "expected a BOOK_UPDATED entry");
    }

    @Test
    void suspendAndReactivateSchool_writeAuditLogEntries() throws Exception {
        String platformEmail = uniqueEmail("auditplatform");
        createTestPlatformSuperAdmin(platformEmail, "pass1234");
        String platformToken = loginAs(platformEmail, "pass1234");

        Institution school = createSchool("Audit School " + System.nanoTime(), "AUDIT" + System.nanoTime() % 100000);

        mockMvc.perform(patch("/api/schools/" + school.getInstitutionId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/schools/" + school.getInstitutionId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(platformToken))
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());

        var logs = auditLogRepository.findByEntityTypeAndEntityId("SCHOOL", school.getInstitutionId());
        var actions = logs.stream().map(AuditLog::getAction).toList();
        assertTrue(actions.contains("SCHOOL_SUSPENDED"), "expected a SCHOOL_SUSPENDED entry");
        assertTrue(actions.contains("SCHOOL_REACTIVATED"), "expected a SCHOOL_REACTIVATED entry");
    }
}
