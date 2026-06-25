package com.codequest.libralink.repository;

import com.codequest.libralink.entity.PickupSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupSlotRepository extends JpaRepository<PickupSlot, Integer> {
    Optional<PickupSlot> findByQrCode(String qrCode);
    List<PickupSlot> findByUserId(Integer userId);
    List<PickupSlot> findByStatus(String status);
    List<PickupSlot> findByCollectedBy(Integer librarianId);
}