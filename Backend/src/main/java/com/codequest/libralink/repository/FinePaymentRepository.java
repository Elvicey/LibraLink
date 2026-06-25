package com.codequest.libralink.repository;

import com.codequest.libralink.entity.FinePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinePaymentRepository extends JpaRepository<FinePayment, Integer> {
    List<FinePayment> findByFineId(Integer fineId);
    List<FinePayment> findByUserId(Integer userId);
}