package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.service.ReadingListService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.Roles;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading-lists")
public class ReadingListController {

    private final ReadingListService readingListService;

    public ReadingListController(ReadingListService readingListService) {
        this.readingListService = readingListService;
    }

    @PreAuthorize(Roles.STAFF)
    @PostMapping
    public ResponseEntity<ReadingList> createReadingList(@RequestBody ReadingList list) {
        return ResponseEntity.ok(readingListService.saveReadingList(list));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ReadingList>> getReadingListsByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(readingListService.getReadingListsByCourse(courseId));
    }

    @PreAuthorize(Roles.STAFF)
    @PutMapping("/{id}/publish")
    public ResponseEntity<ReadingList> publishReadingList(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "true") boolean publish) {
        return ResponseEntity.ok(readingListService.publish(id, publish));
    }
}