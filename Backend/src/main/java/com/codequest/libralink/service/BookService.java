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

    @Autowired
    private NlSearchService nlSearchService;

    @Transactional
    public Book addBook(BookRequest request) {
        assertIsbnAvailable(request.getIsbn(), request.getIsbn13(), null);
        Book book = new Book();
        applyRequestFields(book, request);
        return bookRepository.save(book);
    }

    @Transactional
    public Optional<Book> updateBook(Integer id, BookRequest request) {
        return bookRepository.findById(id).map(book -> {
            assertIsbnAvailable(request.getIsbn(), request.getIsbn13(), id);
            applyRequestFields(book, request);
            return bookRepository.save(book);
        });
    }

    private void assertIsbnAvailable(String isbn, String isbn13, Integer excludeBookId) {
        if (isbn != null && !isbn.isBlank()) {
            boolean taken = bookRepository.findByIsbn(isbn).stream()
                    .anyMatch(b -> excludeBookId == null || !b.getId().equals(excludeBookId));
            if (taken) {
                throw new IllegalArgumentException(
                        "ISBN '" + isbn + "' is already used by another book. "
                                + "Use that book's id in the URL, or choose a different ISBN.");
            }
        }
        if (isbn13 != null && !isbn13.isBlank()) {
            boolean taken = bookRepository.findByIsbn13(isbn13).stream()
                    .anyMatch(b -> excludeBookId == null || !b.getId().equals(excludeBookId));
            if (taken) {
                throw new IllegalArgumentException(
                        "ISBN-13 '" + isbn13 + "' is already used by another book.");
            }
        }
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Integer id) {
        return bookRepository.findById(id);
    }

    public List<Book> searchBooks(String query, String author, String subject, String availability) {
        if (query != null && !query.isBlank()) {
            return nlSearchService.naturalLanguageSearch(query);
        }

        List<Book> results = bookRepository.findAll();

        if (author != null && !author.isBlank()) {
            results = results.stream()
                    .filter(b -> b.getAuthors().stream()
                            .anyMatch(a -> a.getFullName().toLowerCase().contains(author.toLowerCase())))
                    .toList();
        }

        if (subject != null && !subject.isBlank()) {
            results = results.stream()
                    .filter(b -> b.getTitle().toLowerCase().contains(subject.toLowerCase())
                            || (b.getDescription() != null
                                && b.getDescription().toLowerCase().contains(subject.toLowerCase())))
                    .toList();
        }

        if (availability != null && !availability.isBlank()) {
            if (availability.equalsIgnoreCase("available") || availability.equalsIgnoreCase("true")) {
                results = results.stream()
                        .filter(b -> b.getAvailableCopies() > 0)
                        .toList();
            }
        }

        return results;
    }

    public boolean isBookAvailable(Integer bookId) {
        return bookRepository.findById(bookId)
                .map(b -> b.getAvailableCopies() > 0)
                .orElse(false);
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
