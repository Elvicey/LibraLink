package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.service.BorrowRecordService;
import com.codequest.libralink.service.OverdueBookScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.Roles;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/borrow-records")
public class BorrowRecordController {

    @Autowired
    private BorrowRecordService borrowRecordService;

    @Autowired
    private OverdueBookScheduler overdueBookScheduler;

    @PostMapping
    public ResponseEntity<BorrowRecord> createLoan(@RequestBody BorrowRecord record) {
        return new ResponseEntity<>(borrowRecordService.saveRecord(record), HttpStatus.CREATED);
    }

    /** Run the overdue check now (normally a daily cron): flag past-due loans and grow their fines. */
    @PreAuthorize(Roles.STAFF)
    @PostMapping("/run-overdue-check")
    public ResponseEntity<Map<String, Object>> runOverdueCheck() {
        int processed = overdueBookScheduler.runOverdueCheck();
        return ResponseEntity.ok(Map.of("processed", processed));
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

    // Renew and return are addressed by record id; ownership ("mine, or I'm staff") is
    // resolved inside the service once the record is loaded, since the owner isn't known
    // from the path alone. IllegalStateException (business-rule refusals) is surfaced as
    // 400 here; IllegalArgumentException ("not found") and AccessDeniedException (403) are
    // left to propagate to GlobalExceptionHandler / Spring Security.
    @PutMapping("/{id}/renew")
    public ResponseEntity<?> renewBorrow(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(borrowRecordService.renewRecord(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnBorrow(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(borrowRecordService.returnRecord(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
