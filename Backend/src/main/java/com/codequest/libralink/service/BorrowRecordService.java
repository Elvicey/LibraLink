package com.codequest.libralink.service;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.service.NotificationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final NotificationService notificationService;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                               NotificationService notificationService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.notificationService = notificationService;
    }

    // CREATE BORROW RECORD + AUTO NOTIFICATION
    public BorrowRecord saveRecord(BorrowRecord rec) {

        // 1. Save borrow record
        BorrowRecord savedRecord = borrowRecordRepository.save(rec);

        // 2. Create notification
        Notification notification = new Notification();
        notification.setUserId(rec.getUser().getId());  // ✅ FIXED
        notification.setTitle("Book Borrowed");
        notification.setType("BORROW");
        notification.setMessage("You have successfully borrowed a book.");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);

        notificationService.createNotification(notification);
        // 3. Save notification
        notificationService.createNotification(notification);

        return savedRecord;
    }

    // GET ALL BORROW RECORDS
    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordRepository.findAll();
    }
}