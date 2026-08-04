package com.codequest.libralink.service;

import com.codequest.libralink.entity.PickupSlot;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.PickupSlotRepository;
import com.codequest.libralink.repository.ReservationRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class PickupSlotService {

    // The library only accepts pickups during opening hours, Monday–Friday 09:00–17:00.
    private static final LocalTime OPEN = LocalTime.of(9, 0);
    private static final LocalTime CLOSE = LocalTime.of(17, 0);

    private final PickupSlotRepository pickupSlotRepository;
    private final ReservationRepository reservationRepository;
    private final SchoolContext schoolContext;

    // Length of a pickup window in minutes. The slot end is derived from this server-side
    // (single source of truth), so the whole window is guaranteed to fit inside opening
    // hours. Configurable via PICKUP_WINDOW_MINUTES; defaults to a 30-minute window.
    @Value("${pickup.window-minutes:30}")
    private int pickupWindowMinutes;

    public PickupSlotService(PickupSlotRepository pickupSlotRepository,
                              ReservationRepository reservationRepository,
                              SchoolContext schoolContext) {
        this.pickupSlotRepository = pickupSlotRepository;
        this.reservationRepository = reservationRepository;
        this.schoolContext = schoolContext;
    }

    // The overlap check below reads all SCHEDULED slots, decides there's no conflict,
    // then writes a new one - a classic check-then-write race with no single DB row to
    // lock (H4). `synchronized` serializes it within this JVM, which is sufficient for
    // the current single-instance deployment; a multi-instance deployment would need a
    // DB-level exclusion constraint instead.
    @Transactional
    public synchronized PickupSlot scheduleSlot(PickupSlot slot) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        slot.setId(null);
        if (slot.getUserId() == null) {
            throw new IllegalStateException("userId is required.");
        }
        if (slot.getReservationId() == null) {
            throw new IllegalStateException("reservationId is required.");
        }
        if (slot.getSlotStart() == null) {
            throw new IllegalStateException(
                    "slotStart is required (ISO-8601, e.g. 2026-07-27T10:00:00).");
        }

        // The pickup window is fixed server-side, so any client-supplied slotEnd is ignored:
        // the end is always start + the configured window. This keeps the duration a single
        // source of truth and guarantees the whole slot is checked against opening hours.
        slot.setSlotEnd(slot.getSlotStart().plusMinutes(pickupWindowMinutes));

        // Only approve pickups Monday–Friday. The window is well under a day, so it can't
        // cross midnight — checking the start's day is sufficient.
        DayOfWeek day = slot.getSlotStart().getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            throw new IllegalStateException("Pickups are only available Monday to Friday.");
        }

        // Only approve pickups fully inside opening hours (09:00–17:00).
        LocalTime start = slot.getSlotStart().toLocalTime();
        LocalTime end = slot.getSlotEnd().toLocalTime();
        if (start.isBefore(OPEN) || end.isAfter(CLOSE)) {
            throw new IllegalStateException("Pickups must be scheduled between 9:00 AM and 5:00 PM.");
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