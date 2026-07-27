package com.codequest.libralink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_views", indexes = {
        @Index(name = "idx_bookview_user_id", columnList = "user_id"),
        @Index(name = "idx_bookview_book_id", columnList = "book_id")
})
public class BookView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();

    public BookView() {}

    public BookView(User user, Book book) {
        this.user = user;
        this.book = book;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public LocalDateTime getViewedAt() { return viewedAt; }
}