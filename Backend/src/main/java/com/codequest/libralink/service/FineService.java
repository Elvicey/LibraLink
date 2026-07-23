package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.repository.FineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class FineService {

    private final FineRepository fineRepository;

    // Explicit constructor added to handle dependency injection manually
    public FineService(FineRepository fineRepository) {
        this.fineRepository = fineRepository;
    }

    public Fine createFine(Fine fine) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        fine.setId(null);
        if (fine.getUserId() == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (fine.getAmount() == null) {
            throw new IllegalArgumentException("amount is required");
        }
        if (fine.getCreatedAt() == null) {
            fine.setCreatedAt(java.time.LocalDateTime.now());
        }
        if (fine.getUpdatedAt() == null) {
            fine.setUpdatedAt(java.time.LocalDateTime.now());
        }
        if (fine.getStatus() == null || fine.getStatus().isBlank()) {
            fine.setStatus("PENDING");
        }
        return fineRepository.save(fine);
    }

    public Fine getFineById(Integer fineId) {
        return fineRepository.findById(fineId)
                .orElseThrow(() -> new IllegalArgumentException("Fine not found with id: " + fineId));
    }

    /**
     * Same as {@link #getFineById}, but takes a DB row lock. Must be called from
     * within an existing @Transactional method (e.g. FinePaymentService.processPayment)
     * so the lock is held until that transaction commits/rolls back.
     */
    public Fine getFineByIdForUpdate(Integer fineId) {
        return fineRepository.findByIdForUpdate(fineId)
                .orElseThrow(() -> new IllegalArgumentException("Fine not found with id: " + fineId));
    }

    public Fine saveFine(Fine fine) {
        return fineRepository.save(fine);
    }

    public List<Fine> getFinesByUser(Integer userId) {
        return fineRepository.findByUserId(userId);
    }
}