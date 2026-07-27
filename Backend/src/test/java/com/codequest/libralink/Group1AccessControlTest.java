package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.FineRepository;
import com.codequest.libralink.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for the Group 1 access-control remediation (C1-C6): every
 * "get/update my own X" endpoint must derive identity from the JWT rather than
 * trusting a client-supplied userId/studentId, and privileged actions must be
 * gated by role.
 */
class Group1AccessControlTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    private String librarianToken;
    private User studentA;
    private String studentAToken;
    private User studentB;
    private String studentBToken;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(uniqueEmail("g1lib"), "pass1234");
        studentA = createTestStudent(uniqueEmail("g1stuA"), "pass1234");
        studentAToken = loginAs(studentA.getEmail(), "pass1234");
        studentB = createTestStudent(uniqueEmail("g1stuB"), "pass1234");
        studentBToken = loginAs(studentB.getEmail(), "pass1234");
    }

    // --- C1: POST /api/users privilege escalation ---

    @Test
    void createUser_asStudent_returns403() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentAToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "Eve",
                                        "lastName", "Attacker",
                                        "email", uniqueEmail("eve"),
                                        "passwordHash", "irrelevant",
                                        "roles", java.util.List.of(java.util.Map.of("name", "ADMIN"))
                                ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUser_asLibrarian_returns403_onlyAdminMayCreateUsers() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "firstName", "New",
                                        "lastName", "Person",
                                        "email", uniqueEmail("newperson"),
                                        "passwordHash", "irrelevant"
                                ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isForbidden());
    }

    // --- C6: User-scoped GET endpoints must enforce ownership ---

    @Test
    void getUserById_ownAccount_succeeds() throws Exception {
        mockMvc.perform(get("/api/users/" + studentA.getId())
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isOk());
    }

    @Test
    void getUserById_otherAccount_asStudent_returns404() throws Exception {
        // UserService.getUserById hides existence behind 404 for a non-self, non-staff
        // caller (this codebase's convention - see SchoolContext.assertSameSchool) rather
        // than revealing it via 403.
        mockMvc.perform(get("/api/users/" + studentB.getId())
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatePushToken_otherAccount_asStudent_returns403() throws Exception {
        mockMvc.perform(put("/api/users/" + studentB.getId() + "/push-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentAToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("pushToken", "ExpoPushToken[hijack]"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getBorrowRecordsByUser_otherAccount_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/borrow-records/user/" + studentB.getId())
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserFines_otherAccount_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/fines/user/" + studentB.getId())
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isForbidden());
    }

    // --- C4: fine payment amount + ownership fraud ---
    // POST /api/fine-payments is staff-only (records an in-person/cash payment; see
    // FinePaymentController.payFine) - a student can never reach it directly, so these
    // exercise the same amount/ownership validation via a Librarian acting on a student's
    // behalf, which is the endpoint's actual intended caller.

    @Test
    void payFine_insufficientAmount_isRejected() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g1lib"), "pass1234");
        Fine fine = new Fine();
        fine.setUserId(studentA.getId());
        fine.setSchoolId(testInstitution().getInstitutionId());
        fine.setAmount(new BigDecimal("25.00"));
        fine = fineRepository.save(fine);

        mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "fineId", fine.getId(),
                                        "userId", studentA.getId(),
                                        "amountPaid", new BigDecimal("0.01")
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("cover the full fine amount")));
    }

    @Test
    void payFine_cannotPaySomeoneElsesFineByForgingUserId() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g1lib2"), "pass1234");
        Fine fine = new Fine();
        fine.setUserId(studentB.getId());
        fine.setSchoolId(testInstitution().getInstitutionId());
        fine.setAmount(new BigDecimal("25.00"));
        fine = fineRepository.save(fine);

        // Fine belongs to studentB, but the request claims userId=studentA - the payment
        // must never be attached to the wrong owner regardless of who submitted it.
        mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "fineId", fine.getId(),
                                        "userId", studentA.getId(),
                                        "amountPaid", new BigDecimal("25.00")
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("does not belong to this user")));
    }

    @Test
    void payFine_ownFineWithFullAmount_succeeds() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g1lib3"), "pass1234");
        Fine fine = new Fine();
        fine.setUserId(studentA.getId());
        fine.setSchoolId(testInstitution().getInstitutionId());
        fine.setAmount(new BigDecimal("10.00"));
        fine = fineRepository.save(fine);

        mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "fineId", fine.getId(),
                                        "userId", studentA.getId(),
                                        "amountPaid", new BigDecimal("10.00")
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(studentA.getId()));
    }

    // --- C6: AuditLogController must be staff-only ---

    @Test
    void auditLogs_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/audit-logs/user/" + studentA.getId())
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditLogs_asLibrarian_isAllowed() throws Exception {
        mockMvc.perform(get("/api/audit-logs/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk());
    }

    // --- C6: reservation ownership ---

    @Test
    void cancelReservation_otherUsers_asStudent_returns403() throws Exception {
        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle("Reservation Test Book");
        book.setIsbn("978-1-000000" + (int) (Math.random() * 9000 + 1000) + "-1");
        book.setTotalCopies(1);
        book.setAvailableCopies(0);
        book.setActive(true);
        book = bookRepository.save(book);

        Reservation reservation = new Reservation();
        reservation.setUserId(studentB.getId());
        reservation.setBook(book);
        reservation.setSchoolId(testInstitution().getInstitutionId());
        reservation = reservationRepository.save(reservation);

        mockMvc.perform(put("/api/reservations/" + reservation.getId() + "/cancel")
                        .header("Authorization", bearerToken(studentAToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void makeHold_forcesReservationOwnerToCaller() throws Exception {
        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle("Reservation Force Book");
        book.setIsbn("978-1-000000" + (int) (Math.random() * 9000 + 1000) + "-2");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);
        book = bookRepository.save(book);

        // studentA tries to create a reservation while claiming to be studentB.
        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentAToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", studentB.getId(),
                                        "book", java.util.Map.of("id", book.getId())
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(studentA.getId()));
    }
}
