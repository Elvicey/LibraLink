package com.codequest.libralink.service;

import com.codequest.libralink.dto.BookRequest;
import com.codequest.libralink.entity.Author;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.AuthorRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.security.SchoolContext;
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

    @Autowired
    private SchoolContext schoolContext;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public Book addBook(BookRequest request) {
        assertRequiredFields(request);
        assertIsbnAvailable(request.getIsbn(), request.getIsbn13(), null);
        assertValidPublicationYear(request.getPublicationYear());
        Book book = new Book();
        applyRequestFields(book, request);
        Book saved = bookRepository.save(book);
        logBookAction(saved, "BOOK_CREATED", "Created \"" + saved.getTitle() + "\"");
        return saved;
    }

    @Transactional
    public Optional<Book> updateBook(Integer id, BookRequest request) {
        return bookRepository.findById(id).map(book -> {
            assertRequiredFields(request);
            assertIsbnAvailable(request.getIsbn(), request.getIsbn13(), id);
            assertValidPublicationYear(request.getPublicationYear());
            applyRequestFields(book, request);
            Book saved = bookRepository.save(book);
            logBookAction(saved, "BOOK_UPDATED", "Updated \"" + saved.getTitle() + "\"");
            return saved;
        });
    }

    // Not logged if the book has no institution (rare - digital-only/no-school catalogue
    // entries created directly by a PLATFORM_SUPER_ADMIN). schoolId is required on audit_logs.
    private void logBookAction(Book book, String action, String details) {
        if (book.getInstitution() == null) {
            return;
        }
        Integer actorId = schoolContext.currentUser().map(u -> u.userId()).orElse(null);
        auditLogService.log(actorId, book.getInstitution().getInstitutionId(), action, "BOOK", book.getId(), details);
    }

    /** Title, subtitle, ISBN, language, and both copy counts are compulsory. */
    private void assertRequiredFields(BookRequest request) {
        if (isBlank(request.getTitle())) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (isBlank(request.getSubtitle())) {
            throw new IllegalArgumentException("Subtitle is required.");
        }
        if (isBlank(request.getIsbn())) {
            throw new IllegalArgumentException("ISBN is required.");
        }
        if (isBlank(request.getLanguage())) {
            throw new IllegalArgumentException("Language is required.");
        }
        if (request.getTotalCopies() == null) {
            throw new IllegalArgumentException("Total copies is required.");
        }
        if (request.getAvailableCopies() == null) {
            throw new IllegalArgumentException("Available copies is required.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** A 4-digit calendar year, not a negative offset or an implausible future date. */
    private void assertValidPublicationYear(Short publicationYear) {
        if (publicationYear == null) {
            return;
        }
        int nextYear = java.time.Year.now().getValue() + 1;
        if (publicationYear < 1000 || publicationYear > nextYear) {
            throw new IllegalArgumentException(
                    "Publication year must be a 4-digit year between 1000 and " + nextYear + ".");
        }
    }

    /** Set only the book's full readable text (used by the in-app reader and AI narration). */
    @Transactional
    public Optional<Book> updateBookContent(Integer id, String content) {
        return bookRepository.findById(id).map(book -> {
            book.setContent(content);
            return bookRepository.save(book);
        });
    }

    /** Set only the book's copy counts (librarian/admin inventory editing). */
    @Transactional
    public Optional<Book> updateBookAvailability(Integer id, Integer totalCopies, Integer availableCopies) {
        return bookRepository.findById(id).map(book -> {
            if (totalCopies != null) {
                if (totalCopies < 0) {
                    throw new IllegalArgumentException("Total copies cannot be negative.");
                }
                book.setTotalCopies(totalCopies);
            }
            if (availableCopies != null) {
                if (availableCopies < 0) {
                    throw new IllegalArgumentException("Available copies cannot be negative.");
                }
                book.setAvailableCopies(availableCopies);
            }
            int total = book.getTotalCopies() != null ? book.getTotalCopies() : 0;
            int available = book.getAvailableCopies() != null ? book.getAvailableCopies() : 0;
            if (available > total) {
                throw new IllegalArgumentException("Available copies cannot exceed total copies.");
            }
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

    /**
     * Anonymous catalogue browsing stays unscoped (GET /api/books/** is permitAll -
     * deliberately unchanged, no regression for unauthenticated clients). An
     * authenticated, non-platform caller only sees their own school's books;
     * PLATFORM_SUPER_ADMIN sees everything.
     */
    public List<Book> getAllBooks() {
        return scopeResults(bookRepository.findAll(), scopingSchoolId());
    }

    /** Same scoping rule as getAllBooks - hides a cross-tenant book behind a 404 rather
     *  than a 403, matching SchoolContext.assertSameSchool's existence-hiding convention. */
    public Optional<Book> getBookById(Integer id) {
        Integer schoolId = scopingSchoolId();
        return bookRepository.findById(id)
                .filter(b -> schoolId == null || (b.getInstitution() != null
                        && schoolId.equals(b.getInstitution().getInstitutionId())));
    }

    /** Null = don't scope (anonymous caller, or a PLATFORM_SUPER_ADMIN). */
    private Integer scopingSchoolId() {
        if (schoolContext.isPlatformSuperAdmin()) {
            return null;
        }
        return schoolContext.currentUser().map(u -> u.schoolId()).orElse(null);
    }

    public List<Book> searchBooks(String query, String author, String subject, String availability) {
        Integer schoolId = scopingSchoolId();

        if (query != null && !query.isBlank()) {
            return scopeResults(nlSearchService.naturalLanguageSearch(query), schoolId);
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

        return scopeResults(results, schoolId);
    }

    private List<Book> scopeResults(List<Book> books, Integer schoolId) {
        if (schoolId == null) {
            return books;
        }
        return books.stream()
                .filter(b -> b.getInstitution() != null && schoolId.equals(b.getInstitution().getInstitutionId()))
                .toList();
    }

    public boolean isBookAvailable(Integer bookId) {
        return bookRepository.findById(bookId)
                .map(b -> b.getAvailableCopies() > 0)
                .orElse(false);
    }

    private void applyRequestFields(Book book, BookRequest request) {
        // Medium: title is nullable=false in the DB but was never checked here - a
        // missing/blank title used to fall through to a DataIntegrityViolationException
        // (misleading 409 "constraint violation") instead of a 400 naming the actual
        // problem.
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
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
        // Guaranteed non-null by assertRequiredFields - no silent default.
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(request.getAvailableCopies());
        book.setLocationCode(request.getLocationCode());
        book.setDeweyDecimal(request.getDeweyDecimal());
        book.setDigitalOnly(request.isDigitalOnly());
        book.setActive(request.isActive());

        // Server-resolved: a Librarian/Admin always creates/edits within their own school
        // (a client-supplied institutionId is ignored for them); only PLATFORM_SUPER_ADMIN
        // may target a different school explicitly.
        Integer targetSchoolId = schoolContext.resolveTargetSchoolId(request.getInstitutionId());
        if (targetSchoolId != null) {
            institutionRepository.findById(targetSchoolId).ifPresent(book::setInstitution);
        }

        if (request.getAuthorIds() != null && !request.getAuthorIds().isEmpty()) {
            Set<Author> authors = new HashSet<>(authorRepository.findAllById(request.getAuthorIds()));
            book.setAuthors(authors);
        } else {
            book.setAuthors(new HashSet<>());
        }
    }
}
