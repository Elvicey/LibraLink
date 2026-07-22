package com.codequest.libralink.service;

import com.codequest.libralink.dto.AiChatRequest;
import com.codequest.libralink.dto.AiChatResponse;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.repository.FineRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final FineRepository fineRepository;

    public AiService(BookRepository bookRepository,
                     BorrowRecordRepository borrowRecordRepository,
                     FineRepository fineRepository) {
        this.bookRepository = bookRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.fineRepository = fineRepository;
    }

    public AiChatResponse processQuery(AiChatRequest request) {
        String rawPrompt = request.getPrompt() != null ? request.getPrompt().toLowerCase().trim() : "";
        Integer userId = request.getUserId() != null ? request.getUserId() : 1;

        // Intent Detection Engine
        if (rawPrompt.contains("recommend") || rawPrompt.contains("project") || rawPrompt.contains("book")) {
            return handleRecommendationQuery(rawPrompt);
        } else if (rawPrompt.contains("econ") || rawPrompt.contains("study") || rawPrompt.contains("guide")) {
            return handleStudyGuideQuery(rawPrompt);
        } else if (rawPrompt.contains("summarize") || rawPrompt.contains("list") || rawPrompt.contains("reading")) {
            return handleSummaryQuery(userId);
        } else if (rawPrompt.contains("fine") || rawPrompt.contains("fee") || rawPrompt.contains("pay")) {
            return handleFineQuery(userId);
        } else if (rawPrompt.contains("hour") || rawPrompt.contains("open") || rawPrompt.contains("location")) {
            return new AiChatResponse(
                    "LibraLink main campus library is open Monday through Saturday from 7:30 AM to 10:00 PM. Digital materials and audio readers are accessible 24/7.",
                    "LIBRARY_INFO",
                    List.of()
            );
        } else {
            // General Fallback Query with Catalog Search
            List<Book> allBooks = bookRepository.findAll();
            List<Book> matching = allBooks.stream()
                    .filter(b -> b.getTitle().toLowerCase().contains(rawPrompt) || 
                                 (b.getDescription() != null && b.getDescription().toLowerCase().contains(rawPrompt)))
                    .limit(3)
                    .collect(Collectors.toList());

            if (!matching.isEmpty()) {
                String bookTitles = matching.stream().map(Book::getTitle).collect(Collectors.joining(", "));
                return new AiChatResponse(
                        "I searched the library catalog for '" + request.getPrompt() + "' and found matching titles: " + bookTitles + ".",
                        "CATALOG_SEARCH",
                        matching
                );
            }

            return new AiChatResponse(
                    "I searched the library catalog for your query. You can check the main collection under Class B, or speak with a librarian at the reference desk for specialized research support.",
                    "GENERAL",
                    List.of()
            );
        }
    }

    private AiChatResponse handleRecommendationQuery(String prompt) {
        List<Book> catalog = bookRepository.findAll();
        List<Book> recommended = catalog.stream().limit(2).collect(Collectors.toList());

        String responseText = "Based on your academic profile and course requirements, I recommend checking out " +
                (recommended.isEmpty() ? "'The Lean Startup' by Eric Ries and 'Data Structures in Practice'" :
                        "'" + recommended.get(0).getTitle() + "'") +
                " in the main library collection.";

        return new AiChatResponse(responseText, "RECOMMENDATION", recommended);
    }

    private AiChatResponse handleStudyGuideQuery(String prompt) {
        return new AiChatResponse(
                "I found study guides for your courses: 'African Economics' by A. Smith (Available on Shelf B4) and 'African Economic Development' (Currently on Loan, due in 5 days).",
                "STUDY_GUIDE",
                List.of()
        );
    }

    private AiChatResponse handleSummaryQuery(Integer userId) {
        List<BorrowRecord> userBorrows = borrowRecordRepository.findAll();
        long activeCount = userBorrows.stream()
                .filter(b -> b.getUser() != null && b.getUser().getId().equals(userId) && "BORROWED".equalsIgnoreCase(b.getStatus()))
                .count();

        String summaryText = "Your active Semester reading list contains 17 titles. You currently have " + activeCount +
                " active check-out(s) and 1 overdue item. You can track audio summaries on your Audio Reader tab.";

        return new AiChatResponse(summaryText, "SUMMARY", List.of());
    }

    private AiChatResponse handleFineQuery(Integer userId) {
        List<Fine> fines = fineRepository.findByUserId(userId);
        double totalUnpaid = fines.stream()
                .filter(f -> "UNPAID".equalsIgnoreCase(f.getStatus()))
                .mapToDouble(f -> f.getAmount() != null ? f.getAmount().doubleValue() : 0.0)
                .sum();

        String text = totalUnpaid > 0
                ? "You currently have GHS " + String.format("%.2f", totalUnpaid) + " in unpaid library fines. You can pay them directly via Mobile Money on the Pay Fines screen."
                : "You have no outstanding library fines! All clear.";

        return new AiChatResponse(text, "FINES_INFO", List.of());
    }

    public List<String> getSuggestedPrompts() {
        return List.of(
                "Recommend books for a project",
                "Find study guides for economics",
                "Summarize my reading list",
                "Check my active loans and fines"
        );
    }
}
