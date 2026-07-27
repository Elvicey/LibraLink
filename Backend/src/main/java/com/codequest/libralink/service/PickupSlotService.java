package com.codequest.libralink.service;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.PickupSlotRepository;
import com.codequest.libralink.repository.ReservationRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PickupSlotService {

    private final PickupSlotRepository pickupSlotRepository;
    private final ReservationRepository reservationRepository;
    private final SchoolContext schoolContext;

    public PickupSlotService(PickupSlotRepository pickupSlotRepository,
                              ReservationRepository reservationRepository,
                              SchoolContext schoolContext) {
        this.pickupSlotRepository = pickupSlotRepository;
        this.reservationRepository = reservationRepository;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public PickupSlot scheduleSlot(PickupSlot slot) {
        if (slot.getUserId() == null) {
            throw new IllegalStateException("userId is required.");
        }
        if (slot.getReservationId() == null) {
            throw new IllegalStateException("reservationId is required.");
        }
        if (slot.getSlotStart() == null || slot.getSlotEnd() == null) {
            throw new IllegalStateException(
                    "slotStart and slotEnd are required (ISO-8601, e.g. 2026-07-25T10:00:00).");
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
        if (slot.getScheduledAt() == null) {
            slot.setScheduledAt(slot.getSlotStart());
        }
        if (slot.getCreatedAt() == null) {
            slot.setCreatedAt(LocalDateTime.now());
        }
        slot.setStatus("SCHEDULED");

        Reservation reservation = reservationRepository.findById(slot.getReservationId()).orElse(null);
        slot.setSchoolId(reservation != null ? reservation.getSchoolId() : null);

        PickupSlot saved = pickupSlotRepository.save(slot);

        if (reservation != null) {
            reservation.setStatus("READY");
            reservation.setReadyAt(LocalDateTime.now());
            reservationRepository.save(reservation);
        }

        return saved;
    }

    @Transactional
    public PickupSlot collectBookViaQr(String qrCode, Integer librarianId) {
        if (qrCode == null || qrCode.isBlank()) {
            throw new IllegalArgumentException("qrCode query param is required.");
        }
        if (librarianId == null) {
            throw new IllegalArgumentException("librarianId query param is required.");
        }

        PickupSlot slot = pickupSlotRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new IllegalArgumentException("No pickup slot found for qrCode: " + qrCode));

        if ("COLLECTED".equalsIgnoreCase(slot.getStatus())) {
            throw new IllegalArgumentException("This pickup slot was already collected.");
        }

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
        return scoped(pickupSlotRepository.findByUserId(userId));
    }

    public List<PickupSlot> getAllScheduledSlots() {
        return scoped(pickupSlotRepository.findByStatus("SCHEDULED"));
    }

    private List<PickupSlot> scoped(List<PickupSlot> slots) {
        if (schoolContext.isPlatformSuperAdmin()) {
            return slots;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return slots.stream().filter(s -> schoolId.equals(s.getSchoolId())).toList();
    }
}