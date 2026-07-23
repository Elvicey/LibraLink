package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Bookmark;
import com.codequest.libralink.exception.ResourceNotFoundException;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BookmarkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final BookRepository bookRepository;

    public BookmarkService(BookmarkRepository bookmarkRepository, BookRepository bookRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.bookRepository = bookRepository;
    }

    /**
     * Saves a book for a user. Idempotent: saving an already-saved book returns the
     * existing row rather than throwing, so a double-tap on the client is harmless.
     */
    @Transactional
    public Bookmark add(Integer userId, Integer bookId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (bookId == null) {
            throw new IllegalArgumentException("bookId is required");
        }
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found with id " + bookId);
        }
        return bookmarkRepository
                .findByUserIdAndBookId(userId, bookId)
                .orElseGet(() -> bookmarkRepository.save(new Bookmark(userId, bookId)));
    }

    /** Removes a saved book. A no-op when it was not saved, so DELETE stays idempotent. */
    @Transactional
    public void remove(Integer userId, Integer bookId) {
        if (userId == null || bookId == null) {
            throw new IllegalArgumentException("userId and bookId are required");
        }
        bookmarkRepository.deleteByUserIdAndBookId(userId, bookId);
    }

    public boolean isBookmarked(Integer userId, Integer bookId) {
        if (userId == null || bookId == null) {
            return false;
        }
        return bookmarkRepository.existsByUserIdAndBookId(userId, bookId);
    }

    /**
     * The user's saved books, newest first. Resolves every book in a single findAllById
     * rather than one query per bookmark.
     */
    @Transactional(readOnly = true)
    public List<Book> listBooksForUser(Integer userId) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (bookmarks.isEmpty()) {
            return List.of();
        }

        List<Integer> bookIds = bookmarks.stream().map(Bookmark::getBookId).toList();
        Map<Integer, Book> booksById = bookRepository.findAllById(bookIds).stream()
                .collect(Collectors.toMap(Book::getId, Function.identity()));

        // Preserve the newest-first ordering of the bookmarks themselves, and skip any
        // book that has since been deleted.
        return bookmarks.stream()
                .map(bookmark -> booksById.get(bookmark.getBookId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
