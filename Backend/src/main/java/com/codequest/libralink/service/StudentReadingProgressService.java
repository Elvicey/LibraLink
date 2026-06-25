package com.codequest.libralink.service;

import com.codequest.libralink.entity.StudentReadingProgress;
import com.codequest.libralink.repository.StudentReadingProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class StudentReadingProgressService {

    private final StudentReadingProgressRepository progressRepository;

    // Explicit constructor added to handle dependency injection manually
    public StudentReadingProgressService(StudentReadingProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    public StudentReadingProgress updateProgress(Integer studentId, Integer itemId, String status) {
        StudentReadingProgress progress = progressRepository
                .findByStudentIdAndListItemId(studentId, itemId)
                .orElse(StudentReadingProgress.builder()
                        .studentId(studentId)
                        .listItemId(itemId)
                        .build());
        progress.setStatus(status);
        progress.setUpdatedAt(LocalDateTime.now());
        return progressRepository.save(progress);
    }
}