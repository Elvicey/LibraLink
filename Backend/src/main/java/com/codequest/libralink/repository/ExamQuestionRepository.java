package com.codequest.libralink.repository;

import com.codequest.libralink.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Integer> {
    List<ExamQuestion> findByUserId(Integer userId);
    List<ExamQuestion> findByBookId(Integer bookId);
    List<ExamQuestion> findBySessionId(Integer sessionId);
    List<ExamQuestion> findByUserIdAndBookId(Integer userId, Integer bookId);
    List<ExamQuestion> findByDifficulty(String difficulty);
}
