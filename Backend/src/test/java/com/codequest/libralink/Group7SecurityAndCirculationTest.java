package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookCopyRepository;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for the Group 7 remediation (H5, H8, H13):
 * - H5: JwtAuthenticationFilter now re-checks the user against the database on every
 *   request instead of trusting the JWT's claims for the token's full lifetime, so a
 *   deactivated user's existing token stops working immediately rather than up to 24h
 *   later.
 * - H8: CirculationController now delegates to BorrowRecordService.checkOutCopy/
 *   checkInCopy instead of writing to BorrowRecordRepository directly, which previously
 *   meant a check-in never restored Book.availableCopies.
 * - H13: previously nothing tested invalid-JWT rejection.
 */
class Group7SecurityAndCirculationTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    // --- H5: stale JWT for a deactivated user must stop working immediately ---

    @Test
    void deactivatedUser_existingTokenNoLongerGrantsAccess() throws Exception {
        User student = createTestStudent(uniqueEmail("g7deact"), "pass1234");
        String token = loginAs(student.getEmail(), "pass1234");

        // Sanity check: the token works before deactivation.
        mockMvc.perform(get("/api/users/" + student.getId())
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isOk());

        student.setActive(false);
        userRepository.save(student);

        // Same token, same signature, not expired - but the user is now deactivated, so
        // JwtAuthenticationFilter's DB re-check must refuse to authenticate it.
        mockMvc.perform(get("/api/users/" + student.getId())
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deletedUser_existingTokenNoLongerGrantsAccess() throws Exception {
        User student = createTestStudent(uniqueEmail("g7del"), "pass1234");
        String token = loginAs(student.getEmail(), "pass1234");
        Integer studentId = student.getId();

        userRepository.delete(student);

        mockMvc.perform(get("/api/users/" + studentId)
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isUnauthorized());
    }

    // --- H13: nothing previously tested invalid-JWT rejection ---

    @Test
    void malformedJwt_isRejected() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer this.is.not-a-valid-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedJwtSignature_isRejected() throws Exception {
        User student = createTestStudent(uniqueEmail("g7tamper"), "pass1234");
        String token = loginAs(student.getEmail(), "pass1234");
        // Flip the second-to-last character of the signature segment so it no longer
        // verifies. NOTE: flipping the very last character of a base64url string is
        // flaky - trailing chars can carry unused padding bits (e.g. 'a' and 'b' differ
        // only in such a bit), so the "tampered" signature can still decode to the same
        // bytes and pass verification. One character in from the end is never a
        // padding-only bit.
        int tamperIdx = token.length() - 2;
        String tampered = token.substring(0, tamperIdx)
                + (token.charAt(tamperIdx) == 'a' ? 'b' : 'a')
                + token.substring(tamperIdx + 1);

        mockMvc.perform(get("/api/users/" + student.getId())
                        .header("Authorization", bearerToken(tampered)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingAuthorizationHeader_returns401ForProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    // --- H8: circulation check-in must restore Book.availableCopies ---

    @Test
    void circulationCheckOutThenCheckIn_restoresAvailableCopies() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g7lib"), "pass1234");
        User student = createTestStudent(uniqueEmail("g7stu"), "pass1234");

        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle("Circulation Restore Book");
        book.setIsbn("978-7-" + (int) (Math.random() * 900000000 + 100000000) + "-1");
        book.setTotalCopies(2);
        book.setAvailableCopies(2);
        book.setActive(true);
        bookRepository.save(book);

        BookCopy copy = new BookCopy();
        copy.setBarcode("G7-CIRC-" + System.nanoTime());
        copy.setBook(book);
        copy.setSchoolId(testInstitution().getInstitutionId());
        copy.setAvailable(true);
        copy.setCondition("GOOD");
        bookCopyRepository.save(copy);

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", copy.getBarcode(),
                                        "action", "CHECK_OUT",
                                        "userId", student.getId()
                                ))))
                .andExpect(status().isOk());

        Book afterCheckout = bookRepository.findById(book.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(1, afterCheckout.getAvailableCopies(),
                "checkout should decrement availableCopies by 1");

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", copy.getBarcode(),
                                        "action", "CHECK_IN"
                                ))))
                .andExpect(status().isOk());

        Book afterCheckin = bookRepository.findById(book.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(2, afterCheckin.getAvailableCopies(),
                "check-in must restore availableCopies - this was the H8 bug (CirculationController "
                        + "bypassed BorrowRecordService and never restored it)");

        BookCopy reloadedCopy = bookCopyRepository.findById(copy.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(reloadedCopy.isAvailable());
    }

    @Test
    void circulationCheckIn_withNoActiveLoan_returns400() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g7lib2"), "pass1234");

        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle("Never Checked Out Book");
        book.setIsbn("978-7-" + (int) (Math.random() * 900000000 + 100000000) + "-2");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);
        bookRepository.save(book);

        BookCopy copy = new BookCopy();
        copy.setBarcode("G7-NOLOAN-" + System.nanoTime());
        copy.setBook(book);
        copy.setSchoolId(testInstitution().getInstitutionId());
        copy.setAvailable(true);
        copy.setCondition("GOOD");
        bookCopyRepository.save(copy);

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", copy.getBarcode(),
                                        "action", "CHECK_IN"
                                ))))
                .andExpect(status().isBadRequest());
    }
}
