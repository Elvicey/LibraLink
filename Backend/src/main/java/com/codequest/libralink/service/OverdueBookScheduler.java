package com.codequest.libralink.service;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.BorrowRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OverdueBookScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueBookScheduler.class);

    private final BorrowRecordRepository borrowRecordRepository;
    private final NotificationService notificationService;

    public OverdueBookScheduler(BorrowRecordRepository borrowRecordRepository,
                                 NotificationService notificationService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void flagOverdueBooks() {
        log.info("Running overdue book check at {}", LocalDateTime.now());

        LocalDate today = LocalDate.now();
        List<BorrowRecord> overdueRecords =
                borrowRecordRepository.findByStatusAndDueDateBefore("BORROWED", today);

        for (BorrowRecord record : overdueRecords) {
            record.setStatus("OVERDUE");
            borrowRecordRepository.save(record);

            if (record.getUser() != null) {
                Notification notification = new Notification();
                notification.setUserId(record.getUser().getId());
                notification.setSchoolId(record.getSchoolId());
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

        log.info("Overdue book check complete. {} records updated.", overdueRecords.size());
    }
}
