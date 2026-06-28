package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.repository.FinePaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Fine fine = fineService.getFineById(payment.getFineId());

        fine.setStatus("PAID");
        fine.setUpdatedAt(LocalDateTime.now());
        fineService.saveFine(fine);

        return finePaymentRepository.save(payment);
    }
}