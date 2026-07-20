package com.codequest.libralink.service;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.PickupSlotRepository;
import com.codequest.libralink.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PickupSlotService {

    private final PickupSlotRepository pickupSlotRepository;
    private final ReservationRepository reservationRepository;

    public PickupSlotService(PickupSlotRepository pickupSlotRepository,
                              ReservationRepository reservationRepository) {
        this.pickupSlotRepository = pickupSlotRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public PickupSlot scheduleSlot(PickupSlot slot) {
        if (slot.getSlotStart() == null || slot.getSlotEnd() == null) {
            throw new IllegalStateException("slotStart and slotEnd are required.");
        }

        if (slot.getSlotStart().isAfter(slot.getSlotEnd()) || slot.getSlotStart().isEqual(slot.getSlotEnd())) {
            throw new IllegalStateException("slotStart must be before slotEnd.");
        }

        List<PickupSlot> existingSlots = pickupSlotRepository.findByStatus("SCHEDULED");
        for (PickupSlot existing : existingSlots) {
            if (existing.getSlotStart() != null && existing.getSlotEnd() != null) {
                boolean overlaps = slot.getSlotStart().isBefore(existing.getSlotEnd())
                        && slot.getSlotEnd().isAfter(existing.getSlotStart());
                if (overlaps) {
                    throw new IllegalStateException(
                            "Time slot overlaps with an existing scheduled pickup (ID: " + existing.getId() + ").");
                }
            }
        }

        if (slot.getQrCode() == null || slot.getQrCode().isBlank()) {
            slot.setQrCode(UUID.randomUUID().toString());
        }
        slot.setStatus("SCHEDULED");
        PickupSlot saved = pickupSlotRepository.save(slot);

        if (slot.getReservationId() != null) {
            reservationRepository.findById(slot.getReservationId()).ifPresent(res -> {
                res.setStatus("READY");
                res.setReadyAt(LocalDateTime.now());
                reservationRepository.save(res);
            });
        }

        return saved;
    }

    @Transactional
    public PickupSlot collectBookViaQr(String qrCode, Integer librarianId) {
        PickupSlot slot = pickupSlotRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Invalid collection QR code target."));
        slot.setStatus("COLLECTED");
        slot.setCollectedBy(librarianId);
        slot.setCollectedAt(LocalDateTime.now());
        slot.setUpdatedAt(LocalDateTime.now());
        PickupSlot saved = pickupSlotRepository.save(slot);

        if (slot.getReservationId() != null) {
            reservationRepository.findById(slot.getReservationId()).ifPresent(res -> {
                res.setStatus("COLLECTED");
                res.setCollectedAt(LocalDateTime.now());
                reservationRepository.save(res);
            });
        }

        return saved;
    }

    public List<PickupSlot> getSlotsByUser(Integer userId) {
        return pickupSlotRepository.findByUserId(userId);
    }

    public List<PickupSlot> getAllScheduledSlots() {
        return pickupSlotRepository.findByStatus("SCHEDULED");
    }
}