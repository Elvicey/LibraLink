package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<Fine, Integer> {
    List<Fine> findByUserId(Integer userId);
    List<Fine> findByStatus(String status);
    List<Fine> findByBorrowId(Integer borrowId);
}