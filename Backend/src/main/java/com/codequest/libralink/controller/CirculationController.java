package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.service.BookCopyService;
import com.codequest.libralink.service.BorrowRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/circulation")
public class CirculationController {

    private final BookCopyService bookCopyService;
    private final BorrowRecordService borrowRecordService;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;

    public CirculationController(BookCopyService bookCopyService,
                                 BorrowRecordService borrowRecordService,
                                 BorrowRecordRepository borrowRecordRepository,
                                 UserRepository userRepository) {
        this.bookCopyService = bookCopyService;
        this.borrowRecordService = borrowRecordService;
        this.borrowRecordRepository = borrowRecordRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/scan")
    public ResponseEntity<?> scanBook(@RequestBody Map<String, Object> body) {
        String barcode = (String) body.get("barcode");
        String action = (String) body.getOrDefault("action", "CHECK_OUT");
        Integer userId = body.get("userId") != null ? ((Number) body.get("userId")).intValue() : null;

        BookCopy copy = bookCopyService.getCopyByBarcode(barcode)
                .orElse(null);
        if (copy == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No book copy found with barcode: " + barcode));
        }

        if ("CHECK_OUT".equalsIgnoreCase(action)) {
            if (!copy.isAvailable()) {
                return ResponseEntity.badRequest().body(Map.of("error", "This copy is not available for checkout."));
            }
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId is required for check-out."));
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found with ID: " + userId));
            }

            copy.setAvailable(false);
            bookCopyService.registerBookCopy(copy);

            BorrowRecord record = new BorrowRecord();
            record.setBook(copy.getBook());
            record.setBookCopy(copy);
            record.setUser(user);
            record.setStatus("BORROWED");
            record.setDueDate(LocalDate.now().plusDays(14));
            borrowRecordService.saveRecord(record);

            return ResponseEntity.ok(Map.of(
                    "message", "Book checked out successfully",
                    "barcode", barcode,
                    "action", "CHECK_OUT",
                    "dueDate", record.getDueDate().toString()
            ));

        } else if ("CHECK_IN".equalsIgnoreCase(action)) {
            copy.setAvailable(true);
            bookCopyService.registerBookCopy(copy);

            List<BorrowRecord> activeRecords = borrowRecordRepository.findByUserId(userId != null ? userId : 0);
            activeRecords.stream()
                    .filter(r -> r.getBookCopy() != null && r.getBookCopy().getId().equals(copy.getId()))
                    .filter(r -> "BORROWED".equals(r.getStatus()))
                    .findFirst()
                    .ifPresent(record -> {
                        record.setStatus("RETURNED");
                        record.setReturnedAt(LocalDateTime.now());
                        borrowRecordRepository.save(record);
                    });

            return ResponseEntity.ok(Map.of(
                    "message", "Book checked in successfully",
                    "barcode", barcode,
                    "action", "CHECK_IN"
            ));

        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid action. Use CHECK_OUT or CHECK_IN."));
        }
    }
}
