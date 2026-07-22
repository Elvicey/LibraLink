package com.codequest.libralink.controller;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.service.PickupSlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pickup-slots")
public class PickupSlotController {

    private final PickupSlotService pickupSlotService;

    public PickupSlotController(PickupSlotService pickupSlotService) {
        this.pickupSlotService = pickupSlotService;
    }

    @PostMapping
    public ResponseEntity<?> schedule(@RequestBody PickupSlot slot) {
        try {
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