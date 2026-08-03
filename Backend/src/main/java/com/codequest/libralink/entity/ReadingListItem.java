package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_list_items")
public class ReadingListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "reading_list_id", nullable = false)
    private Integer readingListId;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "required_by")
    private LocalDateTime requiredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ReadingListItem() {}

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public ReadingListItem(Integer id, Integer readingListId, Integer bookId,
                           String notes, LocalDateTime requiredBy,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.readingListId = readingListId;
        this.bookId = bookId;
        this.notes = notes;
        this.requiredBy = requiredBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getReadingListId() { return readingListId; }
    public void setReadingListId(Integer readingListId) { this.readingListId = readingListId; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getRequiredBy() { return requiredBy; }
    public void setRequiredBy(LocalDateTime requiredBy) { this.requiredBy = requiredBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}