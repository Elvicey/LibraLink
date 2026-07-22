package com.codequest.libralink.controller;

import com.codequest.libralink.entity.StudentReadingProgress;
import com.codequest.libralink.service.StudentReadingProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reading-progress")
// Lombok removed: @RequiredArgsConstructor is gone
public class StudentReadingProgressController {

    private final StudentReadingProgressService studentReadingProgressService;

    // Explicit constructor added for dependency injection
    public StudentReadingProgressController(StudentReadingProgressService studentReadingProgressService) {
        this.studentReadingProgressService = studentReadingProgressService;
    }

    @PutMapping
    public ResponseEntity<StudentReadingProgress> updateProgress(
            @RequestParam Integer studentId,
            @RequestParam Integer itemId,
            @RequestParam String status) {
        return ResponseEntity.ok(studentReadingProgressService.updateProgress(studentId, itemId, status));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getProgressForStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(studentReadingProgressService.getProgressForStudent(studentId));
    }
}