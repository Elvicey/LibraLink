package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final CurrentUserProvider currentUserProvider;

    public ReservationController(ReservationService reservationService, CurrentUserProvider currentUserProvider) {
        this.reservationService = reservationService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping
    public Reservation makeHold(@RequestBody Reservation reservation) {
        // A patron can only reserve for themselves; a librarian/admin may place a hold
        // on behalf of a specific patron by supplying userId.
        reservation.setUserId(currentUserProvider.resolveActingUserId(reservation.getUserId(), "LIBRARIAN", "ADMIN"));
        return reservationService.createReservation(reservation);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationService.getAllReservations();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelReservation(@PathVariable Integer id) {
        try {
            // Ownership of the reservation is verified inside the service.
            Reservation cancelled = reservationService.cancelReservation(id);
            return ResponseEntity.ok(cancelled);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservationStatus(@PathVariable Integer id,
                                                      @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null || status.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            }
            Reservation updated = reservationService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
