package com.codequest.libralink.controller;

import com.codequest.libralink.entity.ExamQuestion;
import com.codequest.libralink.entity.StudySession;
import com.codequest.libralink.entity.StudySummary;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.AiExamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    private final AiExamService aiExamService;
    private final CurrentUserProvider currentUserProvider;

    public ExamController(AiExamService aiExamService, CurrentUserProvider currentUserProvider) {
        this.aiExamService = aiExamService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/summary")
    public ResponseEntity<?> createSummary(@RequestBody Map<String, Object> body) {
        try {
            Integer bookId = toInteger(body.get("bookId"));
            // Study summaries are personal; always generated for the caller, never for
            // an arbitrary client-supplied userId.
            Integer userId = currentUserProvider.getCurrentUserId();
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
        StudySummary summary = aiExamService.getSummary(id).orElse(null);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        currentUserProvider.requireSelfOrAnyRole(summary.getUserId(), "LIBRARIAN", "ADMIN");
        return ResponseEntity.ok(summary);
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/summaries/user/{userId}")
    public ResponseEntity<List<StudySummary>> getUserSummaries(@PathVariable Integer userId) {
        return ResponseEntity.ok(aiExamService.getUserSummaries(userId));
    }

    @PostMapping("/questions/generate")
    public ResponseEntity<?> generateQuestions(@RequestBody Map<String, Object> body) {
        try {
            Integer bookId = toInteger(body.get("bookId"));
            // Practice questions are personal; always generated for the caller.
            Integer userId = currentUserProvider.getCurrentUserId();
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

            // submitAnswer verifies question ownership internally and throws
            // AccessDeniedException (403) if it doesn't belong to the caller.
            ExamQuestion question = aiExamService.submitAnswer(questionId, answer);
            return ResponseEntity.ok(Map.of(
                    "questionId", question.getId(),
                    "userAnswer", question.getUserAnswer(),
                    "correctAnswer", question.getCorrectAnswer(),
                    "isCorrect", Boolean.TRUE.equals(question.getIsCorrect()),
                    "explanation", question.getExplanation() != null ? question.getExplanation() : ""
            ));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<?> completeSession(@PathVariable Integer sessionId) {
        try {
            // completeSession verifies session ownership internally.
            StudySession session = aiExamService.completeSession(sessionId);
            return ResponseEntity.ok(session);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionId}/questions")
    public ResponseEntity<List<ExamQuestion>> getSessionQuestions(@PathVariable Integer sessionId) {
        StudySession session = aiExamService.getSession(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found with ID: " + sessionId));
        currentUserProvider.requireSelfOrAnyRole(session.getUserId(), "LIBRARIAN", "ADMIN");
        return ResponseEntity.ok(aiExamService.getSessionQuestions(sessionId));
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<List<StudySession>> getUserSessions(@PathVariable Integer userId) {
        return ResponseEntity.ok(aiExamService.getUserSessions(userId));
    }
}
