package com.codequest.libralink.service;

import com.codequest.libralink.entity.*;
import com.codequest.libralink.repository.VoiceCommandRepository;
import com.codequest.libralink.security.SchoolContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VoiceService {

    private static final Logger log = LoggerFactory.getLogger(VoiceService.class);

    private final VoiceCommandRepository voiceCommandRepository;
    private final NlSearchService nlSearchService;
    private final BookService bookService;
    private final ReservationService reservationService;
    private final BorrowRecordService borrowRecordService;
    private final AiExamService aiExamService;
    private final AudioTrackService audioTrackService;
    private final SchoolContext schoolContext;
    private final ObjectMapper objectMapper;

    public VoiceService(VoiceCommandRepository voiceCommandRepository,
                        NlSearchService nlSearchService,
                        BookService bookService,
                        ReservationService reservationService,
                        BorrowRecordService borrowRecordService,
                        AiExamService aiExamService,
                        AudioTrackService audioTrackService,
                        SchoolContext schoolContext) {
        this.voiceCommandRepository = voiceCommandRepository;
        this.nlSearchService = nlSearchService;
        this.bookService = bookService;
        this.reservationService = reservationService;
        this.borrowRecordService = borrowRecordService;
        this.aiExamService = aiExamService;
        this.audioTrackService = audioTrackService;
        this.schoolContext = schoolContext;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public VoiceCommand processVoiceCommand(Integer userId, String transcribedText) {
        VoiceCommand command = new VoiceCommand();
        command.setUserId(userId);
        command.setSchoolId(schoolContext.requireSchoolId());
        command.setTranscribedText(transcribedText);

        try {
            String intent = detectIntent(transcribedText);
            command.setDetectedIntent(intent);

            switch (intent) {
                case "SEARCH" -> handleSearch(command, transcribedText);
                case "RESERVE" -> handleReserve(command, transcribedText, userId);
                case "SUMMARY" -> handleSummary(command, transcribedText, userId);
                case "EXAM" -> handleExam(command, transcribedText, userId);
                case "AUDIO" -> handleAudio(command, transcribedText, userId);
                case "HELP" -> handleHelp(command);
                default -> {
                    command.setStatus("UNKNOWN_INTENT");
                    command.setResponseText("I didn't understand that command. Try saying 'search for books', "
                            + "'summarize a book', or 'generate exam questions'.");
                }
            }
        } catch (Exception e) {
            command.setStatus("FAILED");
            command.setResponseText("Sorry, an error occurred while processing your request: " + e.getMessage());
            log.error("Voice command processing failed for user {}: {}", userId, e.getMessage());
        }

        return voiceCommandRepository.save(command);
    }

    private String detectIntent(String text) {
        String lower = text.toLowerCase();

        if (lower.contains("search") || lower.contains("find") || lower.contains("look for")
                || lower.contains("show me") || lower.contains("book about")) {
            return "SEARCH";
        }
        if (lower.contains("reserve") || lower.contains("hold") || lower.contains("book")) {
            return "RESERVE";
        }
        if (lower.contains("summarize") || lower.contains("summary") || lower.contains("summarise")) {
            return "SUMMARY";
        }
        if (lower.contains("exam") || lower.contains("quiz") || lower.contains("question")
                || lower.contains("test") || lower.contains("study")) {
            return "EXAM";
        }
        if (lower.contains("audio") || lower.contains("listen") || lower.contains("read aloud")
                || lower.contains("play")) {
            return "AUDIO";
        }
        if (lower.contains("help") || lower.contains("what can you do")) {
            return "HELP";
        }
        return "UNKNOWN";
    }

    private void handleSearch(VoiceCommand command, String text) {
        String searchQuery = extractSearchQuery(text);
        List<Book> results = nlSearchService.naturalLanguageSearch(searchQuery);

        command.setActionTaken("Searched catalogue for: " + searchQuery);
        command.setResultData(String.valueOf(results.size()) + " books found");

        if (results.isEmpty()) {
            command.setResponseText("I couldn't find any books matching \"" + searchQuery + "\". Try different keywords.");
        } else {
            StringBuilder response = new StringBuilder("I found " + results.size() + " book(s)");
            if (results.size() <= 3) {
                response.append(":\n");
                for (Book book : results) {
                    response.append("- \"").append(book.getTitle()).append("\"");
                    if (book.getAuthors() != null && !book.getAuthors().isEmpty()) {
                        Author first = book.getAuthors().iterator().next();
                        response.append(" by ").append(first.getFullName());
                    }
                    response.append("\n");
                }
            } else {
                response.append(". The top results are: \"")
                        .append(results.get(0).getTitle()).append("\", \"")
                        .append(results.get(1).getTitle()).append("\", and \"")
                        .append(results.get(2).getTitle()).append("\".");
            }
            command.setResponseText(response.toString());
        }
    }

    private void handleReserve(VoiceCommand command, String text, Integer userId) {
        String bookTitle = extractBookTitle(text);
        List<Book> books = nlSearchService.naturalLanguageSearch(bookTitle);

        if (books.isEmpty()) {
            command.setActionTaken("Reservation attempt for: " + bookTitle);
            command.setResponseText("I couldn't find a book matching \"" + bookTitle + "\". Please try again.");
            return;
        }

        Book book = books.get(0);
        command.setActionTaken("Reserving book: " + book.getTitle());

        try {
            Reservation reservation = new Reservation();
            reservation.setUserId(userId);
            reservation.setBook(book);
            reservationService.createReservation(reservation);

            command.setResultData("Reservation created for book ID " + book.getId());
            command.setResponseText("I've reserved \"" + book.getTitle() + "\" for you. "
                    + (book.getAvailableCopies() > 0
                    ? "It's available now for pickup!"
                    : "You'll be notified when it becomes available."));
        } catch (Exception e) {
            command.setResponseText("I couldn't complete the reservation: " + e.getMessage());
        }
    }

    private void handleSummary(VoiceCommand command, String text, Integer userId) {
        String bookTitle = extractBookTitle(text);
        List<Book> books = nlSearchService.naturalLanguageSearch(bookTitle);

        if (books.isEmpty()) {
            command.setActionTaken("Summary request for: " + bookTitle);
            command.setResponseText("I couldn't find a book matching \"" + bookTitle + "\" for summarization.");
            return;
        }

        Book book = books.get(0);
        command.setActionTaken("Generating summary for: " + book.getTitle());

        try {
            StudySummary summary = aiExamService.createSummary(book.getId(), userId, "BRIEF");
            aiExamService.processSummary(summary.getId());

            command.setResultData("Summary ID " + summary.getId());
            command.setResponseText("I'm generating a summary for \"" + book.getTitle()
                    + "\". It will be ready shortly in your study section.");
        } catch (Exception e) {
            command.setResponseText("I couldn't generate the summary: " + e.getMessage());
        }
    }

    private void handleExam(VoiceCommand command, String text, Integer userId) {
        String bookTitle = extractBookTitle(text);
        List<Book> books = nlSearchService.naturalLanguageSearch(bookTitle);

        if (books.isEmpty()) {
            command.setActionTaken("Exam generation for: " + bookTitle);
            command.setResponseText("I couldn't find a book matching \"" + bookTitle + "\" for exam questions.");
            return;
        }

        Book book = books.get(0);
        command.setActionTaken("Generating exam questions for: " + book.getTitle());

        try {
            List<ExamQuestion> questions = aiExamService.generateQuestions(book.getId(), userId, 5, "MEDIUM");
            command.setResultData(questions.size() + " questions generated");
            command.setResponseText("I've generated " + questions.size() + " practice questions for \""
                    + book.getTitle() + "\". Check your exam section to start the quiz!");
        } catch (Exception e) {
            command.setResponseText("I couldn't generate exam questions: " + e.getMessage());
        }
    }

    private void handleAudio(VoiceCommand command, String text, Integer userId) {
        String bookTitle = extractBookTitle(text);
        List<Book> books = nlSearchService.naturalLanguageSearch(bookTitle);

        if (books.isEmpty()) {
            command.setActionTaken("Audio conversion for: " + bookTitle);
            command.setResponseText("I couldn't find a book matching \"" + bookTitle + "\" for audio conversion.");
            return;
        }

        Book book = books.get(0);
        command.setActionTaken("Converting to audio: " + book.getTitle());

        try {
            AudioTrack track = audioTrackService.initiateConversion(book.getId(), userId, "en-US-Standard-A", "en-US");
            audioTrackService.processConversion(track.getId());

            command.setResultData("Audio track ID " + track.getId());
            command.setResponseText("I'm converting \"" + book.getTitle() + "\" to audio. "
                    + "It will be available in your audio library shortly.");
        } catch (Exception e) {
            command.setResponseText("I couldn't convert to audio: " + e.getMessage());
        }
    }

    private void handleHelp(VoiceCommand command) {
        command.setActionTaken("Help displayed");
        command.setResponseText("Here's what I can do:\n"
                + "- \"Search for [book title or topic]\" - Find books in the catalogue\n"
                + "- \"Reserve [book title]\" - Place a reservation on a book\n"
                + "- \"Summarize [book title]\" - Generate an AI summary\n"
                + "- \"Generate exam questions for [book title]\" - Create practice quiz\n"
                + "- \"Convert [book title] to audio\" - Create audio version\n"
                + "- \"Help\" - Show this message");
    }

    private String extractSearchQuery(String text) {
        return text.replaceAll("(?i)^(search for|find|look for|show me|books? about)\\s*", "").trim();
    }

    private String extractBookTitle(String text) {
        return text.replaceAll("(?i)^(reserve|hold|book|summarize|summarise|generate exam questions for|"
                + "convert|to audio|listen to|read aloud|play)\\s*", "")
                .replaceAll("(?i)\\s*(book|please|now|for me)$", "").trim();
    }

    @Transactional(readOnly = true)
    public List<VoiceCommand> getUserCommands(Integer userId) {
        List<VoiceCommand> commands = voiceCommandRepository.findByUserId(userId);
        if (schoolContext.isPlatformSuperAdmin()) {
            return commands;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return commands.stream().filter(c -> schoolId.equals(c.getSchoolId())).toList();
    }
}
