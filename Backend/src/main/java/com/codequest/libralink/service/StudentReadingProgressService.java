package com.codequest.libralink.service;

import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.entity.StudentReadingProgress;
import com.codequest.libralink.repository.ReadingListItemRepository;
import com.codequest.libralink.repository.StudentReadingProgressRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class StudentReadingProgressService {

    private final StudentReadingProgressRepository progressRepository;
    private final ReadingListItemRepository readingListItemRepository;
    private final SchoolContext schoolContext;

    // Explicit constructor added to handle dependency injection manually
    public StudentReadingProgressService(StudentReadingProgressRepository progressRepository,
                                         ReadingListItemRepository readingListItemRepository,
                                         SchoolContext schoolContext) {
        this.progressRepository = progressRepository;
        this.readingListItemRepository = readingListItemRepository;
        this.schoolContext = schoolContext;
    }

    public StudentReadingProgress updateProgress(Integer studentId, Integer itemId, String status) {
        StudentReadingProgress progress = progressRepository
                .findByStudentIdAndListItemId(studentId, itemId)
                .orElseGet(() -> {
                    StudentReadingProgress created = StudentReadingProgress.builder()
                            .studentId(studentId)
                            .listItemId(itemId)
                            .build();
                    ReadingListItem item = readingListItemRepository.findById(itemId).orElse(null);
                    created.setSchoolId(item != null ? item.getSchoolId() : null);
                    return created;
                });
        progress.setStatus(status);
        progress.setUpdatedAt(LocalDateTime.now());
        return progressRepository.save(progress);
    }

    public java.util.List<StudentReadingProgress> getProgressForStudent(Integer studentId) {
        java.util.List<StudentReadingProgress> progress = progressRepository.findByStudentId(studentId);
        if (schoolContext.isPlatformSuperAdmin()) {
            return progress;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return progress.stream().filter(p -> schoolId.equals(p.getSchoolId())).toList();
    }
}