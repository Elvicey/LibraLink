package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_audio_progress")
public class UserAudioProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "track_id", nullable = false)
    private Integer trackId;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(name = "current_position_seconds", nullable = false)
    private Integer currentPositionSeconds = 0;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @Column(name = "last_listened_at", nullable = false)
    private LocalDateTime lastListenedAt = LocalDateTime.now();

    public UserAudioProgress() {}

    public UserAudioProgress(Integer userId, Integer trackId, Integer currentPositionSeconds, boolean isCompleted) {
        this.userId = userId;
        this.trackId = trackId;
        this.currentPositionSeconds = currentPositionSeconds;
        this.isCompleted = isCompleted;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getTrackId() { return trackId; }
    public void setTrackId(Integer trackId) { this.trackId = trackId; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public Integer getCurrentPositionSeconds() { return currentPositionSeconds; }
    public void setCurrentPositionSeconds(Integer currentPositionSeconds) { this.currentPositionSeconds = currentPositionSeconds; }

    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }

    public LocalDateTime getLastListenedAt() { return lastListenedAt; }
    public void setLastListenedAt(LocalDateTime lastListenedAt) { this.lastListenedAt = lastListenedAt; }

    @PreUpdate
    @PrePersist
    public void updateTimestamp() {
        this.lastListenedAt = LocalDateTime.now();
    }
}
