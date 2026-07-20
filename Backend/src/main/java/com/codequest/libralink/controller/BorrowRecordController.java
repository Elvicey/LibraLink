package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.service.BorrowRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrow-records")
public class BorrowRecordController {

    @Autowired
    private BorrowRecordService borrowRecordService;

    @PreAuthorize("hasRole('LIBRARIAN')")
    @PostMapping
    public BorrowRecord createLoan(@RequestBody BorrowRecord record) {
        return borrowRecordService.saveRecord(record);
    }

    @PreAuthorize("hasRole('LIBRARIAN')")
    @GetMapping
    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordService.getAllBorrowRecords();
    }

    @GetMapping("/user/{userId}")
    public List<BorrowRecord> getBorrowRecordsByUser(@PathVariable Integer userId) {
        return borrowRecordService.getBorrowRecordsByUser(userId);
    }

    @GetMapping("/user/{userId}/current")
    public List<BorrowRecord> getCurrentBorrows(@PathVariable Integer userId) {
        return borrowRecordService.getCurrentBorrows(userId);
    }
}