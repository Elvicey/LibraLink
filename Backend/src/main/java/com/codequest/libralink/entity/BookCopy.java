package com.codequest.libralink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_copies")
public class BookCopy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Many physical copies beInteger to one master Book entry
    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(unique = true, length = 100)
    private String barcode;

    @Column(name = "condition", length = 20)
    private String condition = "GOOD"; // Default value matching database check constraint

    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "acquired_at")
    private LocalDate acquiredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // --- Constructors ---
    public BookCopy() {
        // Required for JSON processing
    }

    public BookCopy(Book book, String barcode, String condition, String notes, LocalDate acquiredAt) {
        this.book = book;
        this.barcode = barcode;
        this.condition = condition;
        this.notes = notes;
        this.acquiredAt = acquiredAt;
    }

    // --- Getters and Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getAcquiredAt() { return acquiredAt; }
    public void setAcquiredAt(LocalDate acquiredAt) { this.acquiredAt = acquiredAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}