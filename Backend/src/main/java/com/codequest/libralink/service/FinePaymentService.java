package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.repository.FinePaymentRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class FinePaymentService {
    private final FinePaymentRepository finePaymentRepository;
    private final FineService fineService;
    private final SchoolContext schoolContext;

    // Lombok removed: explicit constructor added
    public FinePaymentService(FinePaymentRepository finePaymentRepository, FineService fineService,
                              SchoolContext schoolContext) {
        this.finePaymentRepository = finePaymentRepository;
        this.fineService = fineService;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public FinePayment processPayment(FinePayment payment) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        payment.setId(null);
        if (payment.getFineId() == null) {
            throw new IllegalArgumentException("fineId is required");
        }
        if (payment.getUserId() == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (payment.getAmount() == null && payment.getAmountPaid() == null) {
            throw new IllegalArgumentException("amount or amountPaid is required");
        }

        // Locked for the rest of this transaction so a concurrent payment attempt on the
        // same fine can't also read "not yet paid" and double-pay it (H4).
        Fine fine = fineService.getFineByIdForUpdate(payment.getFineId());
        // Staff may only settle a fine that belongs to their own school (PLATFORM_SUPER_ADMIN
        // bypasses this, same as everywhere else SchoolContext is used).
        schoolContext.assertSameSchool(fine.getSchoolId());
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
        payment.setSchoolId(fine.getSchoolId());

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