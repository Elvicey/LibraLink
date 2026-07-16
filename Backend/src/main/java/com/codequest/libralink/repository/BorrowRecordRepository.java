package com.codequest.libralink.repository;

import com.codequest.libralink.entity.BorrowRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Integer> {
    List<BorrowRecord> findByUserId(Integer userId);
}