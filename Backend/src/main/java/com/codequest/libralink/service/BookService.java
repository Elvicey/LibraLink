package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    // Add a new book to the library catalog
    public Book addBook(Book book) {
        return bookRepository.save(book);
    }

    // Retrieve all books in the library
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }
}