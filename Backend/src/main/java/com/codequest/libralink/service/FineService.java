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
        // A Librarian/Admin/School Admin issuing a fine through the staff-only endpoint
        // always issues within their own school, regardless of what schoolId (if any) the
        // client sent - resolveTargetSchoolId ignores a client-supplied value for everyone
        // except PLATFORM_SUPER_ADMIN (see SchoolContext), closing the mass-assignment gap
        // where a client-supplied schoolId used to be trusted whenever present.
        // System-generated fines (overdue accrual, run from a scheduled job with no
        // authenticated request) set schoolId explicitly beforehand instead, since
        // schoolContext has no current user to resolve there.
        if (schoolContext.currentUser().isPresent()) {
            fine.setSchoolId(schoolContext.resolveTargetSchoolId(fine.getSchoolId()));
        } else if (fine.getSchoolId() == null) {
            throw new IllegalArgumentException("schoolId is required");
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