package com.codequest.libralink.service;

import com.codequest.libralink.repository.BorrowRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OverdueBookScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueBookScheduler.class);

    /** Active loan states that can still be overdue (i.e. the book hasn't been returned/lost). */
    private static final List<String> UNRETURNED = List.of("BORROWED", "RENEWED", "OVERDUE");

    private final BorrowRecordRepository borrowRecordRepository;
    private final BorrowRecordService borrowRecordService;

    public OverdueBookScheduler(BorrowRecordRepository borrowRecordRepository,
                                BorrowRecordService borrowRecordService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.borrowRecordService = borrowRecordService;
    }

    // NOTE: this job has no distributed lock, so if this service is ever scaled to multiple
    // instances, each instance's scheduler will independently run this same cron job. Out of
    // scope here (would need e.g. a ShedLock/Postgres-advisory-lock dependency); flagging as a
    // follow-up for whenever horizontal scaling is planned.
    @Scheduled(cron = "0 0 0 * * ?")
    public void flagOverdueBooks() {
        int processed = runOverdueCheck();
        log.info("Overdue check complete: {} loan(s) assessed", processed);
    }

    /**
     * Assess every still-out, past-due loan: flags it OVERDUE and grows its per-day fine. Each loan
     * is handled in its own transaction (assessOverdue is @Transactional) so one bad record can't
     * roll back or block the rest of the batch. Returns how many loans were assessed as overdue.
     * Also invoked on demand by the admin "run overdue check" endpoint.
     */
    public int runOverdueCheck() {
        log.info("Running overdue check at {}", LocalDateTime.now());
        List<Integer> ids = borrowRecordRepository.findOverdueUnreturnedIds(UNRETURNED, LocalDate.now());

        int count = 0;
        for (Integer id : ids) {
            try {
                if (borrowRecordService.assessOverdue(id)) {
                    count++;
                }
            } catch (Exception e) {
                log.error("Failed to assess overdue borrow record {}: {}", id, e.getMessage(), e);
            }
        }
        return count;
    }
}
