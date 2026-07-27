package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BorrowRecordControllerTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    private String librarianToken;
    private User testStudent;
    private Book testBook;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(
                uniqueEmail("borrowlib"), "pass1234");
        testStudent = createTestStudent(uniqueEmail("borrowstu"), "pass1234");

        testBook = new Book();
        testBook.setTitle("Borrow Test Book");
        testBook.setIsbn("978-0-0000000" + (int)(Math.random()*900+100) + "-1");
        testBook.setTotalCopies(5);
        testBook.setAvailableCopies(5);
        testBook.setActive(true);
        testBook.setInstitution(testInstitution());
        bookRepository.save(testBook);
    }

    @Test
    void createBorrowRecord_asLibrarian() throws Exception {
        mockMvc.perform(post("/api/borrow-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "book", java.util.Map.of("id", testBook.getId(), "title", "Borrow Test Book", "isbn", testBook.getIsbn(), "totalCopies", testBook.getTotalCopies(), "availableCopies", testBook.getAvailableCopies()),
                                        "user", java.util.Map.of("id", testStudent.getId()),
                                        "status", "BORROWED",
                                        "dueDate", java.time.LocalDate.now().plusDays(14).toString()
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("BORROWED"));
    }

    @Test
    void getAllBorrowRecords_asLibrarian() throws Exception {
        mockMvc.perform(get("/api/borrow-records")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getBorrowRecordsByUser() throws Exception {
        mockMvc.perform(get("/api/borrow-records/user/" + testStudent.getId())
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getCurrentBorrows() throws Exception {
        mockMvc.perform(get("/api/borrow-records/user/" + testStudent.getId() + "/current")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
