package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookCopyRepository;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CirculationControllerTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    private String librarianToken;
    private User testStudent;
    private Book testBook;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(
                uniqueEmail("circlib"), "pass1234");
        testStudent = createTestStudent(uniqueEmail("circstu"), "pass1234");

        testBook = new Book();
        testBook.setTitle("Circulation Test Book");
        testBook.setIsbn("978-0-0000001" + (int)(Math.random()*900+100) + "-5");
        testBook.setTotalCopies(3);
        testBook.setAvailableCopies(3);
        testBook.setActive(true);
        bookRepository.save(testBook);

        BookCopy copy = new BookCopy();
        copy.setBarcode("CIRC-TEST-" + System.nanoTime());
        copy.setBook(testBook);
        copy.setAvailable(true);
        copy.setCondition("GOOD");
        bookCopyRepository.save(copy);
    }

    @Test
    void scanBook_checkOut() throws Exception {
        String barcode = bookCopyRepository.findAll().stream()
                .filter(c -> c.getBook().getId().equals(testBook.getId()))
                .findFirst().get().getBarcode();

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", barcode,
                                        "action", "CHECK_OUT",
                                        "userId", testStudent.getId()
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Book checked out successfully"))
                .andExpect(jsonPath("$.action").value("CHECK_OUT"))
                .andExpect(jsonPath("$.dueDate").isNotEmpty());
    }

    @Test
    void scanBook_checkIn() throws Exception {
        String barcode = bookCopyRepository.findAll().stream()
                .filter(c -> c.getBook().getId().equals(testBook.getId()))
                .findFirst().get().getBarcode();

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", barcode,
                                        "action", "CHECK_OUT",
                                        "userId", testStudent.getId()
                                ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", barcode,
                                        "action", "CHECK_IN",
                                        "userId", testStudent.getId()
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Book checked in successfully"));
    }

    @Test
    void scanBook_invalidBarcode_returns400() throws Exception {
        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", "INVALID-BARCODE",
                                        "action", "CHECK_OUT",
                                        "userId", testStudent.getId()
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("No book copy found")));
    }

    @Test
    void scanBook_invalidAction_returns400() throws Exception {
        String barcode = bookCopyRepository.findAll().stream()
                .filter(c -> c.getBook().getId().equals(testBook.getId()))
                .findFirst().get().getBarcode();

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", barcode,
                                        "action", "INVALID",
                                        "userId", testStudent.getId()
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid action")));
    }

    @Test
    void scanBook_checkoutMissingUserId_returns400() throws Exception {
        String barcode = bookCopyRepository.findAll().stream()
                .filter(c -> c.getBook().getId().equals(testBook.getId()))
                .findFirst().get().getBarcode();

        mockMvc.perform(post("/api/circulation/scan")
                        .contentType("application/json")
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "barcode", barcode,
                                        "action", "CHECK_OUT"
                                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("userId is required")));
    }
}
