package com.codequest.libralink.controller;

import com.codequest.libralink.entity.StudentReadingProgress;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.StudentReadingProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reading-progress")
// Lombok removed: @RequiredArgsConstructor is gone
public class StudentReadingProgressController {

    private final StudentReadingProgressService studentReadingProgressService;
    private final CurrentUserProvider currentUserProvider;

    // Explicit constructor added for dependency injection
    public StudentReadingProgressController(StudentReadingProgressService studentReadingProgressService,
                                             CurrentUserProvider currentUserProvider) {
        this.studentReadingProgressService = studentReadingProgressService;
        this.currentUserProvider = currentUserProvider;
    }

    @PutMapping
    public ResponseEntity<StudentReadingProgress> updateProgress(
            @RequestParam Integer studentId,
            @RequestParam Integer itemId,
            @RequestParam String status) {
        // A student can only update their own reading progress; a librarian/admin may
        // correct another student's record by supplying studentId.
        Integer targetStudentId = currentUserProvider.resolveActingUserId(studentId, "LIBRARIAN", "ADMIN");
        return ResponseEntity.ok(studentReadingProgressService.updateProgress(targetStudentId, itemId, status));
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#studentId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getProgressForStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(studentReadingProgressService.getProgressForStudent(studentId));
    }
}