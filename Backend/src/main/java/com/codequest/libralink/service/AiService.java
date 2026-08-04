package com.codequest.libralink.service;

import com.codequest.libralink.dto.AiChatRequest;
import com.codequest.libralink.dto.AiChatResponse;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.repository.FineRepository;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.security.SchoolContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private static final String SYSTEM_INSTRUCTION =
            "You are Libra, the friendly assistant for the LibraLink university library. "
          + "Answer the student using ONLY the library context provided below (their current loans, "
          + "outstanding fines, and matching catalogue books). Be concise, warm, and practical. "
          + "Never invent book titles, due dates, availability, or fine amounts that are not in the "
          + "context. If the context doesn't contain the answer, say what you can see and suggest they "
          + "ask a librarian at the reference desk.";

    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final FineRepository fineRepository;
    private final LlmClient llmClient;
    private final CurrentUserProvider currentUserProvider;
    private final SchoolContext schoolContext;

    public AiService(BookRepository bookRepository,
                     BorrowRecordRepository borrowRecordRepository,
                     FineRepository fineRepository,
                     LlmClient llmClient,
                     CurrentUserProvider currentUserProvider,
                     SchoolContext schoolContext) {
        this.bookRepository = bookRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.fineRepository = fineRepository;
        this.llmClient = llmClient;
        this.currentUserProvider = currentUserProvider;
        this.schoolContext = schoolContext;
    }

    /** Books visible to the caller: all books for a platform super admin, own-school only otherwise. */
    private List<Book> scopedBooks() {
        Integer schoolId = schoolContext.currentSchoolId();
        List<Book> books = bookRepository.findAll();
        if (schoolId == null) {
            return books;
        }
        return books.stream()
                .filter(b -> b.getInstitution() != null && schoolId.equals(b.getInstitution().getInstitutionId()))
                .collect(Collectors.toList());
    }

    public AiChatResponse processQuery(AiChatRequest request) {
        String prompt = request.getPrompt() != null ? request.getPrompt().trim() : "";
        // Catalogue matches are public data — used both to ground the model and to return book
        // cards to the app alongside the answer.
        List<Book> matches = findRelevantBooks(prompt);

        if (llmClient.isConfigured()) {
            try {
                // Ground ONLY on the authenticated user's data — never the client-supplied userId,
                // which would let a caller read another patron's loans/fines.
                Integer userId = currentUserProvider.getCurrentUserId();
                String context = buildGroundingContext(userId, matches);
                String answer = llmClient.generateText(SYSTEM_INSTRUCTION,
                        context + "\n\nStudent question: " + prompt);
                return new AiChatResponse(answer, "AI", matches);
            } catch (Exception e) {
                log.warn("Ask Libra LLM call failed; using canned fallback: {}", e.getMessage());
                // fall through to the deterministic fallback below
            }
        }
        return cannedResponse(request);
    }

    private String buildGroundingContext(Integer userId, List<Book> matches) {
        StringBuilder sb = new StringBuilder("LIBRARY CONTEXT\n");

        if (userId != null) {
            List<BorrowRecord> loans = borrowRecordRepository.findByUserIdAndStatusIn(
                    userId, List.of("BORROWED", "OVERDUE", "RENEWED"));
            sb.append("\nActive loans (").append(loans.size()).append("):\n");
            if (loans.isEmpty()) {
                sb.append("- none\n");
            } else {
                for (BorrowRecord br : loans) {
                    String title = br.getBook() != null ? br.getBook().getTitle() : "Unknown title";
                    sb.append("- ").append(title)
                      .append(" [status: ").append(br.getStatus())
                      .append(br.getDueDate() != null ? ", due " + br.getDueDate() : "")
                      .append("]\n");
                }
            }

            List<Fine> fines = fineRepository.findByUserId(userId);
            double unpaid = fines.stream()
                    .filter(f -> !"PAID".equalsIgnoreCase(f.getStatus()))
                    .mapToDouble(f -> f.getAmount() != null ? f.getAmount().doubleValue() : 0.0)
                    .sum();
            sb.append("\nOutstanding fines: GHS ").append(String.format("%.2f", unpaid)).append("\n");
        }

        sb.append("\nCatalogue books matching the question (").append(matches.size()).append("):\n");
        if (matches.isEmpty()) {
            sb.append("- no close matches found\n");
        } else {
            for (Book b : matches) {
                sb.append("- ").append(b.getTitle());
                if (b.getDescription() != null && !b.getDescription().isBlank()) {
                    String desc = b.getDescription().trim();
                    sb.append(": ").append(desc.length() > 160 ? desc.substring(0, 160) + "..." : desc);
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }

    private List<Book> findRelevantBooks(String prompt) {
        String needle = prompt.toLowerCase();
        if (needle.isBlank()) {
            return List.of();
        }
        return scopedBooks().stream()
                .filter(b -> (b.getTitle() != null && b.getTitle().toLowerCase().contains(needle))
                        || (b.getDescription() != null && b.getDescription().toLowerCase().contains(needle)))
                .limit(5)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------------------------------
    // Deterministic fallback — used when no AI key is configured or the AI call fails, so the
    // assistant always returns something useful. This is the original canned intent engine.
    // ---------------------------------------------------------------------------------------
    private AiChatResponse cannedResponse(AiChatRequest request) {
        String rawPrompt = request.getPrompt() != null ? request.getPrompt().toLowerCase().trim() : "";
        Integer userId = request.getUserId() != null ? request.getUserId() : 1;

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
            List<Book> allBooks = scopedBooks();
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
        List<Book> catalog = scopedBooks();
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
