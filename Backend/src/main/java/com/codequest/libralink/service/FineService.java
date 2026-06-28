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
        return fineRepository.save(fine);
    }

    public Fine getFineById(Integer fineId) {
        return fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine system mapping record missing"));
    }

    public Fine saveFine(Fine fine) {
        return fineRepository.save(fine);
    }

    public List<Fine> getFinesByUser(Integer userId) {
        return fineRepository.findByUserId(userId);
    }
}