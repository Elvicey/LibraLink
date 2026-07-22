package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.repository.BookCopyRepository;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookCopyControllerTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    private String librarianToken;
    private Book testBook;
    private String barcode;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(uniqueEmail("copylib"), "pass1234");

        testBook = new Book();
        testBook.setTitle("Copy Test Book");
        testBook.setIsbn("978-" + String.valueOf(System.nanoTime()).substring(0, 12));
        testBook.setTotalCopies(2);
        testBook.setAvailableCopies(2);
        testBook.setActive(true);
        bookRepository.save(testBook);

        barcode = "BC-" + System.nanoTime();
        BookCopy copy = new BookCopy();
        copy.setBook(testBook);
        copy.setBarcode(barcode);
        copy.setCondition("NEW");
        copy.setAvailable(true);
        bookCopyRepository.save(copy);
    }

    @Test
    void getCopyByBarcode_asLibrarian_returnsCopy() throws Exception {
        mockMvc.perform(get("/api/book-copies/barcode/" + barcode)
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.barcode").value(barcode));
    }

    @Test
    void getCopyByBarcode_notFound() throws Exception {
        mockMvc.perform(get("/api/book-copies/barcode/MISSING-BARCODE")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createCopy_duplicateBarcode_returns409() throws Exception {
        mockMvc.perform(post("/api/book-copies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "book", java.util.Map.of("id", testBook.getId()),
                                        "barcode", barcode,
                                        "condition", "NEW",
                                        "notes", "duplicate"
                                ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("already exists")));
    }
}
