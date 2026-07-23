package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.service.BookCopyService;
import com.codequest.libralink.service.BorrowRecordService;
import com.codequest.libralink.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// H8: this controller used to inject BorrowRecordRepository/UserRepository directly and
// duplicate business logic inline - the only controller in the app doing this instead of
// going through a service. That let this flow silently skip logic enforced everywhere
// else (it never restored Book.availableCopies on check-in, for example). It now only
// talks to services, same as every other controller.
@RestController
@RequestMapping("/api/circulation")
public class CirculationController {

    private final BookCopyService bookCopyService;
    private final BorrowRecordService borrowRecordService;
    private final UserService userService;

    public CirculationController(BookCopyService bookCopyService,
                                 BorrowRecordService borrowRecordService,
                                 UserService userService) {
        this.bookCopyService = bookCopyService;
        this.borrowRecordService = borrowRecordService;
        this.userService = userService;
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

        try {
            if ("CHECK_OUT".equalsIgnoreCase(action)) {
                if (userId == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "userId is required for check-out."));
                }
                User user = userService.getUserById(userId).orElse(null);
                if (user == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "User not found with ID: " + userId));
                }

                BorrowRecord record = borrowRecordService.checkOutCopy(copy, user);

                return ResponseEntity.ok(Map.of(
                        "message", "Book checked out successfully",
                        "barcode", barcode,
                        "action", "CHECK_OUT",
                        "dueDate", record.getDueDate().toString()
                ));

            } else if ("CHECK_IN".equalsIgnoreCase(action)) {
                borrowRecordService.checkInCopy(copy);

                return ResponseEntity.ok(Map.of(
                        "message", "Book checked in successfully",
                        "barcode", barcode,
                        "action", "CHECK_IN"
                ));

            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid action. Use CHECK_OUT or CHECK_IN."));
            }
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
