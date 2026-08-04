package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audio_book_tracks")
public class AudioBookTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 255)
    private String author;

    @Column(name = "course_code", length = 50)
    private String courseCode;

    @Column(name = "audio_url", nullable = false, length = 500)
    private String audioUrl;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Column(name = "file_size_bytes")
    private Double fileSizeBytes = 0.0;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "is_available_offline", nullable = false)
    private boolean isAvailableOffline = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public AudioBookTrack() {}

    public AudioBookTrack(String title, String author, String courseCode, String audioUrl, Integer durationSeconds, Double fileSizeBytes) {
        this.title = title;
        this.author = author;
        this.courseCode = courseCode;
        this.audioUrl = audioUrl;
        this.durationSeconds = durationSeconds;
        this.fileSizeBytes = fileSizeBytes;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Double getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Double fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public boolean isAvailableOffline() { return isAvailableOffline; }
    public void setAvailableOffline(boolean availableOffline) { isAvailableOffline = availableOffline; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void setUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
