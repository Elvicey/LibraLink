package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ExamQuestion;
import com.codequest.libralink.entity.StudySession;
import com.codequest.libralink.entity.StudySummary;
import com.codequest.libralink.service.AiExamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    private final AiExamService aiExamService;

    public ExamController(AiExamService aiExamService) {
        this.aiExamService = aiExamService;
    }

    @PostMapping("/summary")
    public ResponseEntity<?> createSummary(@RequestBody Map<String, Object> body) {
        try {
            Integer bookId = toInteger(body.get("bookId"));
            Integer userId = toInteger(body.get("userId"));
            String summaryType = body.get("summaryType") != null
                    ? String.valueOf(body.get("summaryType")) : "BRIEF";
            String content = extractContent(body);

            if (bookId == null || userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "bookId and userId are required."));
            }

            StudySummary summary = aiExamService.createSummary(bookId, userId, summaryType, content);
            aiExamService.processSummary(summary.getId());

            return ResponseEntity.accepted().body(Map.of(
                    "message", "Summary generation initiated",
                    "summaryId", summary.getId(),
                    "status", summary.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/summary/{id}")
    public ResponseEntity<?> getSummary(@PathVariable Integer id) {
        return aiExamService.getSummary(id)
                .map(s -> ResponseEntity.ok((Object) s))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/summaries/user/{userId}")
    public ResponseEntity<List<StudySummary>> getUserSummaries(@PathVariable Integer userId) {
        return ResponseEntity.ok(aiExamService.getUserSummaries(userId));
    }

    @PostMapping("/questions/generate")
    public ResponseEntity<?> generateQuestions(@RequestBody Map<String, Object> body) {
        try {
            Integer bookId = toInteger(body.get("bookId"));
            Integer userId = toInteger(body.get("userId"));
            Integer count = toInteger(body.getOrDefault("count", 5));
            String difficulty = body.get("difficulty") != null
                    ? String.valueOf(body.get("difficulty")) : "MEDIUM";
            String content = extractContent(body);

            if (bookId == null || userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "bookId and userId are required."));
            }

            List<ExamQuestion> questions = aiExamService.generateQuestions(
                    bookId, userId, count, difficulty, content);
            return ResponseEntity.ok(Map.of(
                    "message", "Questions generated",
                    "count", questions.size(),
                    "questions", questions
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String extractContent(Map<String, Object> body) {
        if (body.get("content") != null) {
            return String.valueOf(body.get("content"));
        }
        if (body.get("text") != null) {
            return String.valueOf(body.get("text"));
        }
        return null;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @PostMapping("/questions/{questionId}/answer")
    public ResponseEntity<?> submitAnswer(@PathVariable Integer questionId,
                                           @RequestBody Map<String, String> body) {
        try {
            String answer = body.get("answer");
            if (answer == null || answer.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "answer is required."));
            }

            ExamQuestion question = aiExamService.submitAnswer(questionId, answer);
            return ResponseEntity.ok(Map.of(
                    "questionId", question.getId(),
                    "userAnswer", question.getUserAnswer(),
                    "correctAnswer", question.getCorrectAnswer(),
                    "isCorrect", Boolean.TRUE.equals(question.getIsCorrect()),
                    "explanation", question.getExplanation() != null ? question.getExplanation() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<?> completeSession(@PathVariable Integer sessionId) {
        try {
            StudySession session = aiExamService.completeSession(sessionId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionId}/questions")
    public ResponseEntity<List<ExamQuestion>> getSessionQuestions(@PathVariable Integer sessionId) {
        return ResponseEntity.ok(aiExamService.getSessionQuestions(sessionId));
    }

    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<List<StudySession>> getUserSessions(@PathVariable Integer userId) {
        return ResponseEntity.ok(aiExamService.getUserSessions(userId));
    }
}
