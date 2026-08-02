package com.codequest.libralink.controller;

import com.codequest.libralink.dto.BookRequest;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @PreAuthorize("hasRole('LIBRARIAN')")
    @PostMapping
    public Book createBook(@RequestBody BookRequest request) {
        return bookService.addBook(request);
    }

    @PreAuthorize("hasRole('LIBRARIAN')")
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
}
