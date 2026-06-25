package com.codequest.libralink.controller;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.service.PickupSlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pickup-slots")
// Lombok removed: @RequiredArgsConstructor is gone
public class PickupSlotController {

    private final PickupSlotService pickupSlotService;

    // Explicit constructor added for dependency injection
    public PickupSlotController(PickupSlotService pickupSlotService) {
        this.pickupSlotService = pickupSlotService;
    }

    @PostMapping
    public ResponseEntity<PickupSlot> schedule(@RequestBody PickupSlot slot) {
        return ResponseEntity.ok(pickupSlotService.scheduleSlot(slot));
    }

    @PostMapping("/scan")
    public ResponseEntity<PickupSlot> scanQr(@RequestParam String qrCode, @RequestParam Integer librarianId) {
        return ResponseEntity.ok(pickupSlotService.collectBookViaQr(qrCode, librarianId));
    }
}