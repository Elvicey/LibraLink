package com.codequest.libralink.service;

import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    public Reservation createReservation(Reservation res) {
        return reservationRepository.save(res);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }
}