package com.codequest.libralink.service;

import com.codequest.libralink.dto.BookRequest;
import com.codequest.libralink.entity.Author;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.AuthorRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Transactional
    public Book addBook(BookRequest request) {
        Book book = new Book();
        applyRequestFields(book, request);
        return bookRepository.save(book);
    }

    @Transactional
    public Optional<Book> updateBook(Integer id, BookRequest request) {
        return bookRepository.findById(id).map(book -> {
            applyRequestFields(book, request);
            return bookRepository.save(book);
        });
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Integer id) {
        return bookRepository.findById(id);
    }

    private void applyRequestFields(Book book, BookRequest request) {
        book.setTitle(request.getTitle());
        book.setSubtitle(request.getSubtitle());
        book.setIsbn(request.getIsbn());
        book.setIsbn13(request.getIsbn13());
        book.setPublisherId(request.getPublisherId());
        book.setCategoryId(request.getCategoryId());
        book.setPublicationYear(request.getPublicationYear());
        book.setEdition(request.getEdition());
        book.setLanguage(request.getLanguage());
        book.setDescription(request.getDescription());
        book.setCoverImageUrl(request.getCoverImageUrl());
        book.setDigitalUrl(request.getDigitalUrl());
        book.setTotalCopies(request.getTotalCopies() != null ? request.getTotalCopies() : 1);
        book.setAvailableCopies(request.getAvailableCopies() != null ? request.getAvailableCopies() : 1);
        book.setLocationCode(request.getLocationCode());
        book.setDeweyDecimal(request.getDeweyDecimal());
        book.setDigitalOnly(request.isDigitalOnly());
        book.setActive(request.isActive());

        if (request.getInstitutionId() != null) {
            institutionRepository.findById(request.getInstitutionId())
                    .ifPresent(book::setInstitution);
        }

        if (request.getAuthorIds() != null && !request.getAuthorIds().isEmpty()) {
            Set<Author> authors = new HashSet<>(authorRepository.findAllById(request.getAuthorIds()));
            book.setAuthors(authors);
        } else {
            book.setAuthors(new HashSet<>());
        }
    }
}
