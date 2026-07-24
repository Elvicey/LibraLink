package com.codequest.libralink.controller;

import com.codequest.libralink.dto.BookRequest;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<Book> createBook(@RequestBody BookRequest request) {
        return new ResponseEntity<>(bookService.addBook(request), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Integer id,
                                           @RequestBody BookRequest request) {
        return bookService.updateBook(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    @GetMapping("/search")
    public List<Book> searchBooks(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String availability) {
        return bookService.searchBooks(q, author, subject, availability);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Integer id) {
        return bookService.getBookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** The book's full readable text for the in-app reader (empty string if none set). Public,
     * like the other book GETs. */
    @GetMapping("/{id}/content")
    public ResponseEntity<java.util.Map<String, String>> getBookContent(@PathVariable Integer id) {
        return bookService.getBookById(id)
                .map(book -> ResponseEntity.ok(java.util.Map.of(
                        "content", book.getContent() != null ? book.getContent() : "")))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Save the book's full text (librarian/admin only). */
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/{id}/content")
    public ResponseEntity<java.util.Map<String, Object>> updateBookContent(
            @PathVariable Integer id, @RequestBody java.util.Map<String, String> body) {
        String content = body.get("content");
        return bookService.updateBookContent(id, content)
                .map(book -> ResponseEntity.ok(java.util.Map.<String, Object>of(
                        "id", book.getId(),
                        "hasContent", book.getContent() != null && !book.getContent().isBlank())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Update just the book's copy counts (librarian/admin only). */
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/{id}/availability")
    public ResponseEntity<Book> updateBookAvailability(@PathVariable Integer id,
                                                        @RequestBody java.util.Map<String, Integer> body) {
        return bookService.updateBookAvailability(id, body.get("totalCopies"), body.get("availableCopies"))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
