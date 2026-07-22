package com.codequest.libralink.repository;

import com.codequest.libralink.entity.StudySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudySummaryRepository extends JpaRepository<StudySummary, Integer> {
    List<StudySummary> findByUserId(Integer userId);
    List<StudySummary> findByBookId(Integer bookId);
    List<StudySummary> findByUserIdAndBookId(Integer userId, Integer bookId);
}
