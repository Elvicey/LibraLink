package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.service.ReadingListItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reading_list_items")
public class ReadingListItemController {

    private final ReadingListItemService readingListItemService;

    public ReadingListItemController(ReadingListItemService readingListItemService) {
        this.readingListItemService = readingListItemService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN','LECTURER')")
    @PostMapping
    public ResponseEntity<ReadingListItem> addItem(@RequestBody ReadingListItem item) {
        return ResponseEntity.ok(readingListItemService.addItemToList(item));
    }
}