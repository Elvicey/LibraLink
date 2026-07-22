package com.codequest.libralink.repository;

import com.codequest.libralink.entity.BorrowRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Integer> {
    List<BorrowRecord> findByUserId(Integer userId);

    List<BorrowRecord> findByStatus(String status);

    List<BorrowRecord> findByStatusAndDueDateBefore(String status, LocalDate date);

    List<BorrowRecord> findByUserIdAndStatus(Integer userId, String status);
}