package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.repository.FineRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class FineService {

    private final FineRepository fineRepository;
    private final SchoolContext schoolContext;

    // Explicit constructor added to handle dependency injection manually
    public FineService(FineRepository fineRepository, SchoolContext schoolContext) {
        this.fineRepository = fineRepository;
        this.schoolContext = schoolContext;
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
        // Server-stamped when the caller hasn't already set one (e.g. a Librarian/Admin
        // issuing a fine through the staff-only endpoint): a Librarian/Admin always issues
        // within their own school. System-generated fines (overdue accrual, run from a
        // scheduled job with no authenticated request) set schoolId explicitly beforehand
        // instead, since schoolContext has no current user to resolve there.
        if (fine.getSchoolId() == null) {
            fine.setSchoolId(schoolContext.requireSchoolId());
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
        if (schoolContext.isPlatformSuperAdmin()) {
            return fineRepository.findByUserId(userId);
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return fineRepository.findByUserId(userId).stream()
                .filter(f -> schoolId.equals(f.getSchoolId()))
                .toList();
    }

    /** The still-unpaid fine for a borrow record, if any — used to grow one overdue fine per loan. */
    public Optional<Fine> findUnpaidByBorrowId(Integer borrowId) {
        if (borrowId == null) {
            return Optional.empty();
        }
        return fineRepository.findByBorrowId(borrowId).stream()
                .filter(f -> "UNPAID".equalsIgnoreCase(f.getStatus()))
                .findFirst();
    }
}