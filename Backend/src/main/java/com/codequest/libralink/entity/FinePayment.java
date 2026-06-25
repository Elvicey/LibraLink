package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fine_payments")
public class FinePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fine_id", nullable = false)
    private Integer fineId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount_paid;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FinePayment() {}

    public FinePayment(Integer id, Integer fineId, Integer userId, BigDecimal amount,BigDecimal amount_paid,
                       String paymentMethod, String transactionRef,
                       LocalDateTime paidAt, LocalDateTime createdAt) {
        this.id = id;
        this.fineId = fineId;
        this.userId = userId;
        this.amount = amount;
        this.amount_paid =amount_paid;
        this.paymentMethod = paymentMethod;
        this.transactionRef = transactionRef;
        this.paidAt = paidAt;
        this.createdAt = createdAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getFineId() { return fineId; }
    public void setFineId(Integer fineId) { this.fineId = fineId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getAmount_paid() { return amount_paid; }
    public void setAmount_paid(BigDecimal amount_paid) { this.amount_paid = amount_paid; }


    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}