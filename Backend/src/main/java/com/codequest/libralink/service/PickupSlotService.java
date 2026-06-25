package com.codequest.libralink.service;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.repository.PickupSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PickupSlotService {

    private final PickupSlotRepository pickupSlotRepository;

    // Lombok removed: explicit constructor added
    public PickupSlotService(PickupSlotRepository pickupSlotRepository) {
        this.pickupSlotRepository = pickupSlotRepository;
    }

    public PickupSlot scheduleSlot(PickupSlot slot) {
        slot.setStatus("SCHEDULED");
        return pickupSlotRepository.save(slot);
    }

    public PickupSlot collectBookViaQr(String qrCode, Integer librarianId) {
        PickupSlot slot = pickupSlotRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Invalid collection QR code target."));
        slot.setStatus("COLLECTED");
        slot.setCollectedBy(librarianId);
        slot.setCollectedAt(LocalDateTime.now());
        slot.setUpdatedAt(LocalDateTime.now());
        return pickupSlotRepository.save(slot);
    }
}