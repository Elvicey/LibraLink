package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByUserIdOrderByReservedAtDesc(Integer userId);
}