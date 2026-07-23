package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.service.BorrowRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrow-records")
public class BorrowRecordController {

    @Autowired
    private BorrowRecordService borrowRecordService;

    @PostMapping
    public ResponseEntity<BorrowRecord> createLoan(@RequestBody BorrowRecord record) {
        return new ResponseEntity<>(borrowRecordService.saveRecord(record), HttpStatus.CREATED);
    }

    @GetMapping
    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordService.getAllBorrowRecords();
    }

    // Not covered by the SecurityConfig LIBRARIAN-only matcher for the exact
    // "/api/borrow-records" path, so ownership must be enforced here explicitly.
    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public List<BorrowRecord> getBorrowRecordsByUser(@PathVariable Integer userId) {
        return borrowRecordService.getBorrowRecordsByUser(userId);
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}/current")
    public List<BorrowRecord> getCurrentBorrows(@PathVariable Integer userId) {
        return borrowRecordService.getCurrentBorrows(userId);
    }
}
