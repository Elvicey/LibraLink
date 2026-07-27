package com.codequest.libralink.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fine_payments", indexes = {
        @Index(name = "idx_finepayment_fine_id", columnList = "fine_id"),
        @Index(name = "idx_finepayment_user_id", columnList = "user_id")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class FinePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fine_id", nullable = false)
    private Integer fineId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "school_id", nullable = false)
    private Integer schoolId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    // Medium: an external payment gateway reference should never be reusable across two
    // different payments - without a constraint, nothing stopped it from being. Plain
    // unique columns allow multiple NULLs, so cash/no-ref payments are unaffected.
    @Column(name = "transaction_ref", length = 100, unique = true)
    private String transactionRef;

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public FinePayment() {}

    public FinePayment(Integer id, Integer fineId, Integer userId, BigDecimal amount, BigDecimal amountPaid,
                       String paymentMethod, String transactionRef,
                       LocalDateTime paidAt, LocalDateTime createdAt) {
        this.id = id;
        this.fineId = fineId;
        this.userId = userId;
        this.amount = amount;
        this.amountPaid = amountPaid;
        this.paymentMethod = paymentMethod;
        this.transactionRef = transactionRef;
        this.paidAt = paidAt;
        this.createdAt = createdAt;
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (paidAt == null) {
            paidAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (amountPaid == null && amount != null) {
            amountPaid = amount;
        }
        if (amount == null && amountPaid != null) {
            amount = amountPaid;
        }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getFineId() { return fineId; }
    public void setFineId(Integer fineId) { this.fineId = fineId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getSchoolId() { return schoolId; }
    public void setSchoolId(Integer schoolId) { this.schoolId = schoolId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}