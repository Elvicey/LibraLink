package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.service.ReadingListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading-lists")
public class ReadingListController {

    private final ReadingListService readingListService;

    public ReadingListController(ReadingListService readingListService) {
        this.readingListService = readingListService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN','LECTURER')")
    @PostMapping
    public ResponseEntity<ReadingList> createReadingList(@RequestBody ReadingList list) {
        return new ResponseEntity<>(readingListService.saveReadingList(list), HttpStatus.CREATED);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ReadingList>> getReadingListsByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(readingListService.getReadingListsByCourse(courseId));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN','LECTURER')")
    @PutMapping("/{id}/publish")
    public ResponseEntity<ReadingList> publishReadingList(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "true") boolean publish) {
        return ResponseEntity.ok(readingListService.publish(id, publish));
    }
}