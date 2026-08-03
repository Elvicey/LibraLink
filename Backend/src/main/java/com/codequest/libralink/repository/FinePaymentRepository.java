package com.codequest.libralink.repository;

import com.codequest.libralink.entity.FinePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinePaymentRepository extends JpaRepository<FinePayment, Integer> {
    List<FinePayment> findByFineId(Integer fineId);
    List<FinePayment> findByUserId(Integer userId);

    /** Used to make Paystack verify idempotent — a reference is settled at most once. */
    Optional<FinePayment> findByTransactionRef(String transactionRef);
}