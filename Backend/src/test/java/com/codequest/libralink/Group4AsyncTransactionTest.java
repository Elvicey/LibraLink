package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.StudySummary;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.VoiceCommand;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.StudySummaryRepository;
import com.codequest.libralink.security.AuthenticatedUser;
import com.codequest.libralink.service.VoiceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Regression test for the Group 4 async/transaction remediation (H1):
 * VoiceService.processVoiceCommand must not wrap the whole voice-command flow in one
 * outer transaction, because it calls a synchronous @Transactional creation method
 * followed immediately by an @Async processing method that re-queries the row by id on
 * a different thread/connection. Under the old code, that row wasn't committed/visible
 * yet, so the async method's findById threw "not found" and the record was stuck at
 * PENDING forever.
 */
class Group4AsyncTransactionTest extends BaseApiTest {

    @Autowired
    private VoiceService voiceService;

    @Autowired
    private StudySummaryRepository studySummaryRepository;

    @Autowired
    private BookRepository bookRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void voiceSummaryCommand_asyncProcessorSeesCommittedRow_neverThrowsNotFound() throws Exception {
        // Note: the title deliberately avoids the substring "book" - VoiceService's
        // naive intent detector checks for "reserve"/"hold"/"book" before "summarize",
        // so a title containing "book" would be misdetected as a RESERVE command.
        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle("H1RaceNovelXyz123");
        book.setDescription("A sufficiently long description used as the summary source "
                + "content for the Group 4 async/transaction race regression test.");
        book.setIsbn("978-4-" + (int) (Math.random() * 900000000 + 100000000) + "-1");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);
        bookRepository.save(book);

        User student = createTestStudent(uniqueEmail("g4voice"), "pass1234");

        // This test calls VoiceService directly rather than through mockMvc, so there's no
        // JwtAuthenticationFilter to populate the SecurityContext - VoiceService.processVoiceCommand
        // needs one (it stamps the VoiceCommand's schoolId via SchoolContext.requireSchoolId()).
        AuthenticatedUser principal = new AuthenticatedUser(
                student.getId(), student.getEmail(), testInstitution().getInstitutionId(), List.of("STUDENT"));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));

        VoiceCommand command = voiceService.processVoiceCommand(student.getId(), "summarize H1RaceNovelXyz123");

        assertEquals("SUMMARY", command.getDetectedIntent());
        assertNotNull(command.getResultData(), "a summary should have been created synchronously");

        Integer summaryId = Integer.parseInt(command.getResultData().replaceAll("\\D+", ""));

        StudySummary summary = pollUntilNotPending(summaryId);

        // No AI API key is configured in the test profile, so the async worker is
        // expected to fail the summary - but it must fail because of that (a real
        // business reason), never because it couldn't find the row it was just told
        // to process.
        assertNotEquals("PENDING", summary.getStatus(),
                "async processor should have picked up and transitioned the summary out of PENDING");
        assertNotEquals("Study summary not found", summary.getErrorMessage(),
                "async processor must see the row committed by the synchronous creation step (H1)");
    }

    private StudySummary pollUntilNotPending(Integer summaryId) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 5000;
        StudySummary summary;
        do {
            Thread.sleep(50);
            summary = studySummaryRepository.findById(summaryId).orElseThrow();
        } while ("PENDING".equals(summary.getStatus()) && System.currentTimeMillis() < deadline);
        return summary;
    }
}
