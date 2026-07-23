package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Medium: AudioBookTrackService.saveOrUpdateProgress does a find-by-(user,track)-or-create
// with no locking. Without a DB constraint, two concurrent requests (e.g. a double-tap on
// "save progress") can both miss the find and both insert, leaving two progress rows for
// the same user+track that silently diverge from then on. The unique constraint makes the
// second insert fail loudly (already mapped to 409 by GlobalExceptionHandler) instead of
// corrupting data.
@Entity
@Table(name = "user_audio_progress",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_audio_progress_user_track",
                columnNames = {"user_id", "track_id"}))
public class UserAudioProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "track_id", nullable = false)
    private Integer trackId;

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
