package com.codequest.libralink.repository;

import com.codequest.libralink.entity.StudentReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentReadingProgressRepository extends JpaRepository<StudentReadingProgress, Integer> {
    Optional<StudentReadingProgress> findByStudentIdAndListItemId(Integer studentId, Integer listItemId);
    List<StudentReadingProgress> findByStudentId(Integer studentId);
    List<StudentReadingProgress> findByStatus(String status);
}