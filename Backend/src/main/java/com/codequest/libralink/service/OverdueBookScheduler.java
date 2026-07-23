package com.codequest.libralink.service;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.BorrowRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OverdueBookScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueBookScheduler.class);

    private final BorrowRecordRepository borrowRecordRepository;
    private final NotificationService notificationService;
    private final TransactionTemplate transactionTemplate;

    public OverdueBookScheduler(BorrowRecordRepository borrowRecordRepository,
                                 NotificationService notificationService,
                                 PlatformTransactionManager transactionManager) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.notificationService = notificationService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    // NOTE: this job has no distributed lock, so if this service is ever scaled to
    // multiple instances, each instance's scheduler will independently run this same
    // cron job and send duplicate overdue notifications. Out of scope for this fix
    // (would need e.g. a ShedLock/Postgres-advisory-lock dependency); flagging as a
    // follow-up for whenever horizontal scaling is planned.
    @Scheduled(cron = "0 0 0 * * ?")
    public void flagOverdueBooks() {
        log.info("Running overdue book check at {}", LocalDateTime.now());

        LocalDate today = LocalDate.now();
        List<BorrowRecord> overdueRecords =
                borrowRecordRepository.findByStatusAndDueDateBefore("BORROWED", today);

        // Each record is flagged + notified in its own short transaction (rather than
        // one long transaction wrapping the whole loop + every synchronous push call)
        // so that a slow/hung push call or a single bad record can't hold a DB
        // connection open for the whole job, and can't roll back or block every other
        // record in the batch (H3).
        int updated = 0;
        for (BorrowRecord record : overdueRecords) {
            try {
                transactionTemplate.executeWithoutResult(status -> flagOneRecord(record));
                updated++;
            } catch (Exception e) {
                log.error("Failed to flag borrow record {} as OVERDUE: {}",
                        record.getId(), e.getMessage(), e);
            }
        }

        log.info("Overdue book check complete. {}/{} records updated.", updated, overdueRecords.size());
    }

    private void flagOneRecord(BorrowRecord record) {
        record.setStatus("OVERDUE");
        borrowRecordRepository.save(record);

        if (record.getUser() != null) {
            Notification notification = new Notification();
            notification.setUserId(record.getUser().getId());
            notification.setType("OVERDUE");
            notification.setTitle("Book Overdue");
            notification.setMessage("The book \"" + record.getBook().getTitle()
                    + "\" was due on " + record.getDueDate() + ". Please return it as soon as possible.");
            notification.setChannel("PUSH");
            notification.setReferenceId(record.getId());
            notification.setReferenceType("BORROW_RECORD");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }

        log.info("Marked borrow record {} as OVERDUE for user {}",
                record.getId(), record.getUser() != null ? record.getUser().getId() : "unknown");
    }
}
