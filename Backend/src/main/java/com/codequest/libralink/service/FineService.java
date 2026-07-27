package com.codequest.libralink.service;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.repository.FineRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.util.List;

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
        // Server-stamped, not client-supplied - a Librarian/Admin always issues within
        // their own school (this endpoint is staff-only, so a schoolId is always present).
        fine.setSchoolId(schoolContext.requireSchoolId());
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
}