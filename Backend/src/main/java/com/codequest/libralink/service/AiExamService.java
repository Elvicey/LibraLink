package com.codequest.libralink.service;

import com.codequest.libralink.entity.*;
import com.codequest.libralink.repository.*;
import com.codequest.libralink.security.SchoolContext;
import com.codequest.libralink.security.CurrentUserProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class AiExamService {

    private static final Logger log = LoggerFactory.getLogger(AiExamService.class);

    private final StudySummaryRepository studySummaryRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final StudySessionRepository studySessionRepository;
    private final BookRepository bookRepository;
    private final SchoolContext schoolContext;
    private final CurrentUserProvider currentUserProvider;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;

    private static final String TUTOR_SYSTEM =
            "You are an expert academic tutor. Provide clear, accurate, and educational responses.";

    public AiExamService(StudySummaryRepository studySummaryRepository,
                         ExamQuestionRepository examQuestionRepository,
                         StudySessionRepository studySessionRepository,
                         BookRepository bookRepository,
                         SchoolContext schoolContext,
                         CurrentUserProvider currentUserProvider,
                         LlmClient llmClient) {
        this.studySummaryRepository = studySummaryRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.studySessionRepository = studySessionRepository;
        this.bookRepository = bookRepository;
        this.schoolContext = schoolContext;
        this.currentUserProvider = currentUserProvider;
        this.llmClient = llmClient;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public StudySummary createSummary(Integer bookId, Integer userId, String summaryType) {
        return createSummary(bookId, userId, summaryType, null);
    }

    @Transactional
    public StudySummary createSummary(Integer bookId, Integer userId, String summaryType, String contentOverride) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));

        String content = resolveBookContent(book, contentOverride, "summarize");

        StudySummary summary = new StudySummary();
        summary.setBookId(bookId);
        summary.setUserId(userId);
        summary.setSchoolId(book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null);
        summary.setTitle((book.getTitle() != null ? book.getTitle() : "Book")
                + " - " + (summaryType != null ? summaryType : "BRIEF") + " Summary");
        summary.setOriginalText(content);
        summary.setSummaryType(summaryType != null ? summaryType : "BRIEF");
        summary.setStatus("PENDING");

        return studySummaryRepository.save(summary);
    }

    private String resolveBookContent(Book book, String contentOverride, String action) {
        if (contentOverride != null && !contentOverride.isBlank()) {
            return contentOverride.trim();
        }
        if (book.getDescription() != null && !book.getDescription().isBlank()) {
            return book.getDescription().trim();
        }
        throw new IllegalStateException(
                "Book has no textual content to " + action + ". "
                        + "Set the book's description, or pass a non-empty \"content\" field in the request body.");
    }

    @Async
    public CompletableFuture<StudySummary> processSummary(Integer summaryId) {
        StudySummary summary = studySummaryRepository.findById(summaryId)
                .orElseThrow(() -> new com.codequest.libralink.exception.ResourceNotFoundException(
                        "Study summary not found with id: " + summaryId));

        summary.setStatus("PROCESSING");
        studySummaryRepository.save(summary);

        try {
            String prompt = buildSummaryPrompt(summary.getOriginalText(), summary.getSummaryType());
            String aiResponse = llmClient.generateText(TUTOR_SYSTEM, prompt);

            summary.setSummaryText(aiResponse);
            summary.setStatus("COMPLETED");
            studySummaryRepository.save(summary);

            log.info("Summary generation completed for summary {}", summaryId);
            return CompletableFuture.completedFuture(summary);

        } catch (Exception e) {
            summary.setStatus("FAILED");
            summary.setErrorMessage(e.getMessage());
            studySummaryRepository.save(summary);

            log.error("Summary generation failed for summary {}: {}", summaryId, e.getMessage());
            return CompletableFuture.completedFuture(summary);
        }
    }

    @Transactional
    public List<ExamQuestion> generateQuestions(Integer bookId, Integer userId,
                                                 Integer count, String difficulty) {
        return generateQuestions(bookId, userId, count, difficulty, null);
    }

    @Transactional
    public List<ExamQuestion> generateQuestions(Integer bookId, Integer userId,
                                                 Integer count, String difficulty,
                                                 String contentOverride) {
        String content;
        Integer schoolId;
        if (bookId != null) {
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));
            content = resolveBookContent(book, contentOverride, "generate questions from");
            schoolId = book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null;
        } else {
            // Topic/text-based quiz: no source book, so a non-empty topic/text is required.
            if (contentOverride == null || contentOverride.isBlank()) {
                throw new IllegalArgumentException("Provide a topic or text to generate questions from.");
            }
            content = contentOverride.trim();
            // No book to derive a school from - scope to the caller's own school instead.
            schoolId = schoolContext.currentSchoolId();
        }

        int questionCount = (count != null && count > 0) ? Math.min(count, 20) : 5;
        String diff = (difficulty != null && !difficulty.isBlank()) ? difficulty : "MEDIUM";

        StudySession session = new StudySession();
        session.setUserId(userId);
        session.setBookId(bookId);
        session.setSchoolId(schoolId);
        session.setSessionType("PRACTICE_EXAM");
        session.setTotalQuestions(questionCount);
        session = studySessionRepository.save(session);

        return generateQuestionsFromAi(content, questionCount, diff, bookId, userId, session.getId(), schoolId);
    }

    private List<ExamQuestion> generateQuestionsFromAi(String bookContent, int count,
                                                        String difficulty, Integer bookId,
                                                        Integer userId, Integer sessionId, Integer schoolId) {
        if (!llmClient.isConfigured()) {
            throw new RuntimeException("AI API key not configured. Question generation is unavailable.");
        }

        try {
            String prompt = buildQuestionPrompt(bookContent, count, difficulty);
            // JSON mode: Gemini returns a strict JSON array so parsing is reliable.
            String aiResponse = llmClient.generateJson(TUTOR_SYSTEM, prompt);
            return parseQuestionsFromAi(aiResponse, bookId, userId, sessionId, schoolId);

        } catch (Exception e) {
            log.error("AI question generation failed: {}", e.getMessage());
            throw new RuntimeException("AI exam generation is unavailable. Please try again later.", e);
        }
    }

    private String buildSummaryPrompt(String content, String type) {
        String truncated = content.length() > 4000 ? content.substring(0, 4000) + "..." : content;
        return switch (type != null ? type.toUpperCase() : "BRIEF") {
            case "DETAILED" -> "Provide a detailed summary of the following academic text. "
                    + "Include key arguments, evidence, and conclusions.\n\nText:\n" + truncated;
            case "KEY_CONCEPTS" -> "Extract and list the key concepts from the following academic text. "
                    + "For each concept, provide a brief explanation.\n\nText:\n" + truncated;
            case "CHAPTERWISE" -> "Break down the following text into logical chapters/sections and provide "
                    + "a summary for each.\n\nText:\n" + truncated;
            default -> "Provide a concise brief summary of the following academic text in 3-5 paragraphs.\n\nText:\n" + truncated;
        };
    }

    private String buildQuestionPrompt(String content, int count, String difficulty) {
        String truncated = content.length() > 4000 ? content.substring(0, 4000) + "..." : content;
        return "Generate " + count + " multiple-choice exam questions at " + difficulty
                + " difficulty about the following topic or text. "
                + "Return a JSON array where each object has exactly these fields: "
                + "\"question\" (string), "
                + "\"optionA\", \"optionB\", \"optionC\", \"optionD\" (the four answer choices, plain text with no letter prefixes), "
                + "\"correctAnswer\" (exactly one of the letters \"A\", \"B\", \"C\", or \"D\"), "
                + "\"questionType\" (always \"MULTIPLE_CHOICE\"), "
                + "\"explanation\" (one sentence explaining why the answer is correct)."
                + "\n\nTopic/text:\n" + truncated;
    }

    private List<ExamQuestion> parseQuestionsFromAi(String aiResponse, Integer bookId,
                                                     Integer userId, Integer sessionId, Integer schoolId) {
        List<ExamQuestion> questions = new ArrayList<>();
        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```\\s*", "");
            }

            JsonNode arr = objectMapper.readTree(jsonStr);
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    ExamQuestion q = new ExamQuestion();
                    q.setBookId(bookId);
                    q.setUserId(userId);
                    q.setSchoolId(schoolId);
                    q.setSessionId(sessionId);
                    q.setQuestion(node.path("question").asText(""));
                    q.setCorrectAnswer(node.path("correctAnswer").asText(""));
                    q.setOptionA(node.path("optionA").asText(""));
                    q.setOptionB(node.path("optionB").asText(""));
                    q.setOptionC(node.path("optionC").asText(""));
                    q.setOptionD(node.path("optionD").asText(""));
                    q.setQuestionType(node.path("questionType").asText("MULTIPLE_CHOICE"));
                    q.setDifficulty(node.path("difficulty").asText("MEDIUM"));
                    q.setExplanation(node.path("explanation").asText(""));
                    questions.add(examQuestionRepository.save(q));
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse AI response as questions: {}", e.getMessage());
        }
        return questions;
    }

    @Transactional
    public ExamQuestion submitAnswer(Integer questionId, String userAnswer) {
        ExamQuestion question = examQuestionRepository.findById(questionId)
                .orElseThrow(() -> new com.codequest.libralink.exception.ResourceNotFoundException(
                        "Question not found with ID: " + questionId));
        currentUserProvider.requireSelfOrAnyRole(question.getUserId(), "LIBRARIAN", "ADMIN");

        question.setUserAnswer(userAnswer);
        question.setIsCorrect(userAnswer.trim().equalsIgnoreCase(question.getCorrectAnswer().trim()));
        return examQuestionRepository.save(question);
    }

    @Transactional
    public StudySession completeSession(Integer sessionId) {
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new com.codequest.libralink.exception.ResourceNotFoundException(
                        "Session not found with id: " + sessionId));
        currentUserProvider.requireSelfOrAnyRole(session.getUserId(), "LIBRARIAN", "ADMIN");

        List<ExamQuestion> questions = examQuestionRepository.findBySessionId(sessionId);
        long correct = questions.stream().filter(q -> Boolean.TRUE.equals(q.getIsCorrect())).count();

        session.setCorrectAnswers((int) correct);
        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());

        return studySessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Optional<StudySummary> getSummary(Integer id) {
        Optional<StudySummary> summary = studySummaryRepository.findById(id);
        summary.ifPresent(s -> schoolContext.assertSameSchool(s.getSchoolId()));
        return summary;
    }

    @Transactional(readOnly = true)
    public List<StudySummary> getUserSummaries(Integer userId) {
        return scoped(studySummaryRepository.findByUserId(userId), StudySummary::getSchoolId);
    }

    @Transactional(readOnly = true)
    public List<ExamQuestion> getSessionQuestions(Integer sessionId) {
        return scoped(examQuestionRepository.findBySessionId(sessionId), ExamQuestion::getSchoolId);
    }

    @Transactional(readOnly = true)
    public List<StudySession> getUserSessions(Integer userId) {
        return scoped(studySessionRepository.findByUserId(userId), StudySession::getSchoolId);
    }

    private <T> List<T> scoped(List<T> items, java.util.function.Function<T, Integer> schoolIdOf) {
        if (schoolContext.isPlatformSuperAdmin()) {
            return items;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return items.stream().filter(i -> schoolId.equals(schoolIdOf.apply(i))).toList();
    }

    @Transactional(readOnly = true)
    public Optional<StudySession> getSession(Integer id) {
        return studySessionRepository.findById(id);
    }
}
