package com.codequest.libralink.repository;

import com.codequest.libralink.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Integer> {
    List<StudySession> findByUserId(Integer userId);
    List<StudySession> findByUserIdAndBookId(Integer userId, Integer bookId);
    List<StudySession> findByIsCompleted(Boolean isCompleted);
}
