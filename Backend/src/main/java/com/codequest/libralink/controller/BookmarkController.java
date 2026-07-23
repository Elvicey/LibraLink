package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Bookmark;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.BookmarkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * A user's personal saved-books list, backing the bookmark control on the book
 * detail screen and the Reading Lists screen.
 * <p>
 * Every write is attributed to the authenticated caller via {@link CurrentUserProvider};
 * a client-supplied userId is never trusted.
 */
@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;
    private final CurrentUserProvider currentUserProvider;

    public BookmarkController(BookmarkService bookmarkService, CurrentUserProvider currentUserProvider) {
        this.bookmarkService = bookmarkService;
        this.currentUserProvider = currentUserProvider;
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public List<Book> getBookmarks(@PathVariable Integer userId) {
        return bookmarkService.listBooksForUser(userId);
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}/book/{bookId}")
    public Map<String, Boolean> isBookmarked(@PathVariable Integer userId, @PathVariable Integer bookId) {
        return Map.of("bookmarked", bookmarkService.isBookmarked(userId, bookId));
    }

    @PostMapping
    public ResponseEntity<Bookmark> addBookmark(@RequestBody Map<String, Integer> body) {
        Integer userId = currentUserProvider.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Integer bookId = body.get("bookId");
        if (bookId == null) {
            throw new IllegalArgumentException("bookId is required");
        }
        return new ResponseEntity<>(bookmarkService.add(userId, bookId), HttpStatus.CREATED);
    }

    @DeleteMapping("/book/{bookId}")
    public ResponseEntity<Void> removeBookmark(@PathVariable Integer bookId) {
        Integer userId = currentUserProvider.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        bookmarkService.remove(userId, bookId);
        return ResponseEntity.noContent().build();
    }
}
