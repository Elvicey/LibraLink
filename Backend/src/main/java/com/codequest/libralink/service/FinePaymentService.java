package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.repository.FinePaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class FinePaymentService {
    private final FinePaymentRepository finePaymentRepository;
    private final FineService fineService;

    // Lombok removed: explicit constructor added
    public FinePaymentService(FinePaymentRepository finePaymentRepository, FineService fineService) {
        this.finePaymentRepository = finePaymentRepository;
        this.fineService = fineService;
    }

    @Transactional
    public FinePayment processPayment(FinePayment payment) {
        if (payment.getFineId() == null) {
            throw new IllegalArgumentException("fineId is required");
        }
        if (payment.getUserId() == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (payment.getAmount() == null && payment.getAmountPaid() == null) {
            throw new IllegalArgumentException("amount or amountPaid is required");
        }

        Fine fine = fineService.getFineById(payment.getFineId());
        if (!fine.getUserId().equals(payment.getUserId())) {
            throw new IllegalArgumentException("Fine does not belong to this user");
        }
        if ("PAID".equalsIgnoreCase(fine.getStatus())) {
            throw new IllegalArgumentException("Fine is already paid");
        }

        if (payment.getAmount() == null) {
            payment.setAmount(payment.getAmountPaid());
        }
        if (payment.getAmountPaid() == null) {
            payment.setAmountPaid(payment.getAmount());
        }

        BigDecimal amountPaid = payment.getAmountPaid();
        if (amountPaid.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if (amountPaid.compareTo(fine.getAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Payment amount must cover the full fine amount of " + fine.getAmount());
        }
        LocalDateTime now = LocalDateTime.now();
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(now);
        }
        if (payment.getCreatedAt() == null) {
            payment.setCreatedAt(now);
        }

        fine.setStatus("PAID");
        fine.setUpdatedAt(now);
        fineService.saveFine(fine);

        return finePaymentRepository.save(payment);
    }
}