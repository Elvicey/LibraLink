package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_summaries")
public class StudySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String summaryText;

    @Column(name = "summary_type", length = 50)
    private String summaryType; // BRIEF, DETAILED, KEY_CONCEPTS, CHAPTERWISE

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public StudySummary() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getSummaryText() { return summaryText; }
    public void setSummaryText(String summaryText) { this.summaryText = summaryText; }

    public String getSummaryType() { return summaryType; }
    public void setSummaryType(String summaryType) { this.summaryType = summaryType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
