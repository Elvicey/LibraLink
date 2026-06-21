package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    @Autowired private ReservationService reservationService;

    @PostMapping
    public Reservation makeHold(@RequestBody Reservation reservation) {
        return reservationService.createReservation(reservation);
    }
}