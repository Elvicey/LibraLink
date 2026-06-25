package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_reading_progress")
public class StudentReadingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "list_item_id", nullable = false)
    private Integer listItemId;

    @Column(nullable = false, length = 20)
    private String status = "UNREAD";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public StudentReadingProgress() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer studentId;
        private Integer listItemId;

        public Builder studentId(Integer studentId) {
            this.studentId = studentId;
            return this;
        }

        public Builder listItemId(Integer listItemId) {
            this.listItemId = listItemId;
            return this;
        }

        public StudentReadingProgress build() {
            StudentReadingProgress progress = new StudentReadingProgress();
            progress.studentId = this.studentId;
            progress.listItemId = this.listItemId;
            return progress;
        }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }

    public Integer getListItemId() { return listItemId; }
    public void setListItemId(Integer listItemId) { this.listItemId = listItemId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}