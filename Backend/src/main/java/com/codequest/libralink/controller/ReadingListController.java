package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.service.ReadingListService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading-lists")
// Lombok removed: @RequiredArgsConstructor is gone
public class ReadingListController {

    private final ReadingListService readingListService;

    // Explicit constructor added for dependency injection
    public ReadingListController(ReadingListService readingListService) {
        this.readingListService = readingListService;
    }

    @PostMapping
    public ResponseEntity<ReadingList> createReadingList(@RequestBody ReadingList list) {
        return ResponseEntity.ok(readingListService.saveReadingList(list));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ReadingList>> getReadingListsByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(readingListService.getReadingListsByCourse(courseId));
    }
}