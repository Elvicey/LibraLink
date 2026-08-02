package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_slots")
public class PickupSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "loan_id")
    private Integer loanId;

    @Column(name = "qr_code", nullable = false, unique = true, length = 100)
    private String qrCode;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    @Column(name = "reservation_id", nullable = false)
    private Integer reservationId;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "collected_by")
    private Integer collectedBy;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Column(name = "slot_start")
    private LocalDateTime slotStart;

    @Column(name = "slot_end")
    private LocalDateTime slotEnd;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PickupSlot() {}

    public PickupSlot(Integer id, Integer userId, Integer loanId, String qrCode,
                      String status, Integer reservationId, LocalDateTime scheduledAt,
                      Integer collectedBy, LocalDateTime collectedAt,
                      LocalDateTime slotStart, LocalDateTime slotEnd,
                      LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.loanId = loanId;
        this.qrCode = qrCode;
        this.status = status;
        this.reservationId = reservationId;
        this.scheduledAt = scheduledAt;
        this.collectedBy = collectedBy;
        this.collectedAt = collectedAt;
        this.slotStart = slotStart;
        this.slotEnd = slotEnd;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getLoanId() { return loanId; }
    public void setLoanId(Integer loanId) { this.loanId = loanId; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getReservationId() {return reservationId;}
    public void setReservationId(Integer reservationId) {this.reservationId = reservationId;}

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public Integer getCollectedBy() { return collectedBy; }
    public void setCollectedBy(Integer collectedBy) { this.collectedBy = collectedBy; }

    public LocalDateTime getCollectedAt() { return collectedAt; }
    public void setCollectedAt(LocalDateTime collectedAt) { this.collectedAt = collectedAt; }

    public LocalDateTime getSlotStart() {return slotStart;}
    public void setSlotStart(LocalDateTime slotStart) {this.slotStart = slotStart;}

    public LocalDateTime getSlotEnd() {return slotEnd;}
    public void setSlotEnd(LocalDateTime slotEnd) {this.slotEnd = slotEnd;}

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}