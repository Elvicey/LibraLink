package com.codequest.libralink.controller;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.PickupSlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pickup-slots")
public class PickupSlotController {

    private final PickupSlotService pickupSlotService;
    private final CurrentUserProvider currentUserProvider;

    public PickupSlotController(PickupSlotService pickupSlotService, CurrentUserProvider currentUserProvider) {
        this.pickupSlotService = pickupSlotService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping
    public ResponseEntity<?> schedule(@RequestBody PickupSlot slot) {
        try {
            // A patron can only schedule their own pickup; a librarian/admin may schedule
            // on behalf of a specific patron by supplying userId.
            slot.setUserId(currentUserProvider.resolveActingUserId(slot.getUserId(), "LIBRARIAN", "ADMIN"));
            return ResponseEntity.ok(pickupSlotService.scheduleSlot(slot));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/scan")
    public ResponseEntity<?> scanQr(@RequestParam(required = false) String qrCode,
                                    @RequestParam(required = false) Integer librarianId) {
        try {
            return ResponseEntity.ok(pickupSlotService.collectBookViaQr(qrCode, librarianId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PickupSlot>> getUserSlots(@PathVariable Integer userId) {
        return ResponseEntity.ok(pickupSlotService.getSlotsByUser(userId));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping("/scheduled")
    public ResponseEntity<List<PickupSlot>> getScheduledSlots() {
        return ResponseEntity.ok(pickupSlotService.getAllScheduledSlots());
    }
}