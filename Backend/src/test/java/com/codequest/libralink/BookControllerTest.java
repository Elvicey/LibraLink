package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookControllerTest extends BaseApiTest {

    @Autowired
    private BookRepository bookRepository;

    private String librarianToken;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(
                uniqueEmail("booklib"), "pass1234");
    }

    private Book createTestBook(String title, String isbn) {
        Book book = new Book();
        book.setTitle(title);
        book.setIsbn(isbn);
        book.setTotalCopies(3);
        book.setAvailableCopies(3);
        book.setLanguage("English");
        book.setActive(true);
        book.setInstitution(testInstitution());
        return bookRepository.save(book);
    }

    @Test
    void getAllBooks_returnsList() throws Exception {
        createTestBook("Things Fall Apart", "978-0-435-91350-1");
        createTestBook("Homegoing", "978-0-399-58817-1");

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void getBookById_found() throws Exception {
        Book book = createTestBook("Atomic Habits", "978-0-7352-1129-2");

        mockMvc.perform(get("/api/books/" + book.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Atomic Habits"))
                .andExpect(jsonPath("$.isbn").value("978-0-7352-1129-2"));
    }

    @Test
    void getBookById_notFound() throws Exception {
        mockMvc.perform(get("/api/books/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchBooks_byQuery() throws Exception {
        createTestBook("Data Structures in C", "111-1-111-11111-1");
        createTestBook("Introduction to Algorithms", "222-2-222-22222-2");

        mockMvc.perform(get("/api/books/search").param("q", "Data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void createBook_asLibrarian_returnsBook() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Clean Code",
                                        "subtitle", "A Handbook of Agile Software Craftsmanship",
                                        "isbn", "978-0-13-235088-4",
                                        "totalCopies", 5,
                                        "availableCopies", 5,
                                        "language", "English",
                                        "isActive", true
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Clean Code"))
                .andExpect(jsonPath("$.isbn").value("978-0-13-235088-4"))
                .andExpect(jsonPath("$.totalCopies").value(5));
    }

    @Test
    void updateBook_asLibrarian() throws Exception {
        Book book = createTestBook("Old Title", "999-9-999-99999-9");

        mockMvc.perform(put("/api/books/" + book.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "New Title",
                                        "subtitle", "Revised Edition",
                                        "isbn", "999-9-999-99999-9",
                                        "totalCopies", 10,
                                        "availableCopies", 10,
                                        "language", "English",
                                        "isActive", true
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Title"))
                .andExpect(jsonPath("$.totalCopies").value(10));
    }

    @Test
    void createBook_negativePublicationYear_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Bad Year Book",
                                        "subtitle", "A Test Subtitle",
                                        "isbn", "000-0-000-00000-1",
                                        "totalCopies", 1,
                                        "availableCopies", 1,
                                        "language", "English",
                                        "publicationYear", -100
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_implausibleFuturePublicationYear_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Too Future Book",
                                        "subtitle", "A Test Subtitle",
                                        "isbn", "000-0-000-00000-2",
                                        "totalCopies", 1,
                                        "availableCopies", 1,
                                        "language", "English",
                                        "publicationYear", 9999
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_validPublicationYear_succeeds() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Good Year Book",
                                        "subtitle", "A Test Subtitle",
                                        "isbn", "000-0-000-00000-3",
                                        "totalCopies", 1,
                                        "availableCopies", 1,
                                        "language", "English",
                                        "publicationYear", 2020
                                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publicationYear").value(2020));
    }

    @Test
    void createBook_missingSubtitle_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "No Subtitle Book",
                                        "isbn", "000-0-000-00000-4",
                                        "language", "English",
                                        "totalCopies", 1,
                                        "availableCopies", 1
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_missingIsbn_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "No ISBN Book",
                                        "subtitle", "A Test Subtitle",
                                        "language", "English",
                                        "totalCopies", 1,
                                        "availableCopies", 1
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_missingLanguage_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "No Language Book",
                                        "subtitle", "A Test Subtitle",
                                        "isbn", "000-0-000-00000-5",
                                        "totalCopies", 1,
                                        "availableCopies", 1
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_missingCopyCounts_returns400() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "No Copies Book",
                                        "subtitle", "A Test Subtitle",
                                        "isbn", "000-0-000-00000-6",
                                        "language", "English"
                                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBook_notFound() throws Exception {
        mockMvc.perform(put("/api/books/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "title", "Doesn't Matter",
                                        "totalCopies", 1,
                                        "availableCopies", 1
                                ))))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchBooks_byAvailability() throws Exception {
        Book unavailable = createTestBook("Unavailable Book", "444-4-444-44444-4");
        unavailable.setAvailableCopies(0);
        bookRepository.save(unavailable);

        mockMvc.perform(get("/api/books/search").param("availability", "available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].isbn", not(hasItem("444-4-444-44444-4"))));
    }
}
