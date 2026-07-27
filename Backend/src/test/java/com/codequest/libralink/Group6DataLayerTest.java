package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression test for the Group 6 data-layer remediation (H10): BorrowRecord's
 * user/book/bookCopy/reservation associations were switched from EAGER to LAZY to stop a
 * single unfiltered findAll()/findByX() from eagerly joining 4+ tables (each of which
 * cascades into further EAGER associations of its own). This must not change what comes
 * back over the API - with open-in-view enabled (Spring Boot default), the nested
 * user/book objects should still be fully populated in the JSON response, just fetched
 * lazily instead of via one big join.
 */
class Group6DataLayerTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    @Test
    void getBorrowRecordsByUser_lazyAssociationsStillSerializeFully() throws Exception {
        String librarianToken = createAndGetLibrarianToken(uniqueEmail("g6lib"), "pass1234");
        User student = createTestStudent(uniqueEmail("g6stu"), "pass1234");

        Book book = new Book();
        book.setTitle("Lazy Fetch Test Book");
        book.setIsbn("978-6-" + (int) (Math.random() * 900000000 + 100000000) + "-1");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);
        bookRepository.save(book);

        BorrowRecord record = new BorrowRecord();
        record.setBook(book);
        record.setUser(student);
        record.setStatus("BORROWED");
        record.setDueDate(LocalDate.now().plusDays(14));
        borrowRecordRepository.save(record);

        mockMvc.perform(get("/api/borrow-records/user/" + student.getId())
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].book.title").value("Lazy Fetch Test Book"))
                .andExpect(jsonPath("$[0].book.id").value(book.getId()))
                .andExpect(jsonPath("$[0].user.id").value(student.getId()))
                .andExpect(jsonPath("$[0].user.email").value(student.getEmail()));
    }
}
