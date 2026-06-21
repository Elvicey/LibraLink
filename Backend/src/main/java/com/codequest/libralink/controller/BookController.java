package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books") // Your endpoints will start with http://localhost:8080/api/books
public class BookController {

    @Autowired
    private BookService bookService;

    // Endpoint to add a book (POST request)
    @PostMapping
    public Book createBook(@RequestBody Book book) {
        return bookService.addBook(book);
    }

    // Endpoint to view all library books (GET request)
    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }
}