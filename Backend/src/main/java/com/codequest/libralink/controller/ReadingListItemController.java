package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.service.ReadingListItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reading_list_items")
public class ReadingListItemController {

    private final ReadingListItemService readingListItemService;

    public ReadingListItemController(ReadingListItemService readingListItemService) {
        this.readingListItemService = readingListItemService;
    }

    @GetMapping("/list/{readingListId}")
    public ResponseEntity<List<ReadingListItem>> getItems(@PathVariable Integer readingListId) {
        return ResponseEntity.ok(readingListItemService.getItemsByReadingList(readingListId));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    @PostMapping
    public ResponseEntity<ReadingListItem> addItem(@RequestBody ReadingListItem item) {
        return new ResponseEntity<>(readingListItemService.addItemToList(item), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    @PostMapping("/bulk")
    public ResponseEntity<?> addItemsBulk(@RequestBody Map<String, Object> body) {
        Integer readingListId = body.get("readingListId") != null
                ? Integer.valueOf(String.valueOf(body.get("readingListId")))
                : null;
        Object rawBookIds = body.get("bookIds");
        if (readingListId == null || !(rawBookIds instanceof List<?> rawList) || rawList.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "readingListId and bookIds are required"));
        }
        List<Integer> bookIds = rawList.stream()
                .map(id -> Integer.valueOf(String.valueOf(id)))
                .toList();
        String priority = body.get("priority") != null ? String.valueOf(body.get("priority")) : "REQUIRED";
        return ResponseEntity.ok(readingListItemService.addBooksBulk(readingListId, bookIds, priority));
    }
}
