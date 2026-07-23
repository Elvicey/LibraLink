package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "borrow_records", indexes = {
        @Index(name = "idx_borrow_user_id", columnList = "user_id"),
        @Index(name = "idx_borrow_book_id", columnList = "book_id"),
        @Index(name = "idx_borrow_status", columnList = "status"),
        @Index(name = "idx_borrow_due_date", columnList = "due_date")
})
public class BorrowRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // H10: these 4 associations were all EAGER (user/book/bookCopy/reservation were the
    // worst offender named in the audit - a single unfiltered findAll()/findByX() eagerly
    // joined 4 tables, each of which cascades into further EAGER associations of its own
    // (User.roles, Book.institution, etc.), causing a large multi-table join explosion for
    // even a simple record fetch. Flipped to LAZY; open-in-view (Spring Boot default) keeps
    // the Hibernate session open through response serialization, so these still populate
    // correctly in JSON responses, just via a separate query per access instead of one big
    // join - a good trade for the endpoints here, which return small result sets.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "copy_id")
    private BookCopy bookCopy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "BORROWED"; // CHECK (status IN ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'RENEWED'))

    @Column(name = "borrowed_at", nullable = false, updatable = false)
    private LocalDateTime borrowedAt = LocalDateTime.now();

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    @Column(name = "renewal_count", nullable = false)
    private Short renewalCount = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BorrowRecord() {}

    // --- Getters and Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }


    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public BookCopy getBookCopy() { return bookCopy; }
    public void setBookCopy(BookCopy bookCopy) { this.bookCopy = bookCopy; }

    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getBorrowedAt() { return borrowedAt; }
    public void setBorrowedAt(LocalDateTime borrowedAt) { this.borrowedAt = borrowedAt; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getReturnedAt() { return returnedAt; }
    public void setReturnedAt(LocalDateTime returnedAt) { this.returnedAt = returnedAt; }

    public Short getRenewalCount() { return renewalCount; }
    public void setRenewalCount(Short renewalCount) { this.renewalCount = renewalCount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}