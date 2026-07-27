package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A book saved by a single user to their personal reading list.
 * <p>
 * Distinct from {@link ReadingListItem}, which belongs to a lecturer-authored,
 * course-scoped reading list. A bookmark is owned by the student themselves.
 */
@Entity
@Table(
        name = "bookmarks",
        // A user cannot save the same book twice; the service is idempotent, and this
        // is the backstop against concurrent double-taps.
        uniqueConstraints = @UniqueConstraint(
                name = "uk_bookmarks_user_book",
                columnNames = {"user_id", "book_id"}
        ),
        indexes = {
                @Index(name = "idx_bookmarks_user", columnList = "user_id")
        }
)
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Bookmark() {}

    public Bookmark(Integer userId, Integer bookId) {
        this.userId = userId;
        this.bookId = bookId;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
