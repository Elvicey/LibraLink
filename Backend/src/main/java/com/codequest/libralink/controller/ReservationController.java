package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
<<<<<<< HEAD
import java.util.Map;
=======
>>>>>>> origin/main

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

<<<<<<< HEAD
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }
=======
    @Autowired
    private ReservationService reservationService;
>>>>>>> origin/main

    @PostMapping
    public Reservation makeHold(@RequestBody Reservation reservation) {
        return reservationService.createReservation(reservation);
    }

<<<<<<< HEAD
    @PreAuthorize("hasRole('LIBRARIAN')")
=======
>>>>>>> origin/main
    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationService.getAllReservations();
    }
<<<<<<< HEAD

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelReservation(@PathVariable Integer id) {
        try {
            Reservation cancelled = reservationService.cancelReservation(id);
            return ResponseEntity.ok(cancelled);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('LIBRARIAN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservationStatus(@PathVariable Integer id,
                                                      @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            Reservation updated = reservationService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
=======
}
>>>>>>> origin/main
