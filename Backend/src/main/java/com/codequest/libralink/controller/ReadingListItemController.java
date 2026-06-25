package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.service.ReadingListItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reading_list_items")
// Lombok removed: @RequiredArgsConstructor is gone
public class ReadingListItemController {

    private final ReadingListItemService readingListItemService;

    // Explicit constructor added for dependency injection
    public ReadingListItemController(ReadingListItemService readingListItemService) {
        this.readingListItemService = readingListItemService;
    }

    @PostMapping
    public ResponseEntity<ReadingListItem> addItem(@RequestBody ReadingListItem item) {
        return ResponseEntity.ok(readingListItemService.addItemToList(item));
    }
}