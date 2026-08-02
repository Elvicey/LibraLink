package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
<<<<<<< HEAD
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
=======
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.service.NotificationService;
>>>>>>> origin/main
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BorrowRecordRepository borrowRecordRepository;
<<<<<<< HEAD
    private final BookRepository bookRepository;
    private final NotificationService notificationService;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                               BookRepository bookRepository,
                               NotificationService notificationService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public BorrowRecord saveRecord(BorrowRecord rec) {
        Book book = rec.getBook();
        if (book != null && book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("Book is not available for borrowing.");
        }

        BorrowRecord savedRecord = borrowRecordRepository.save(rec);

        if (book != null) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
            book.setBorrowCount(book.getBorrowCount() + 1);
            bookRepository.save(book);
        }

        if (rec.getUser() != null) {
            Notification notification = new Notification();
            notification.setUserId(rec.getUser().getId());
            notification.setTitle("Book Borrowed");
            notification.setType("BORROW");
            notification.setMessage("You have successfully borrowed \""
                    + (book != null ? book.getTitle() : "a book") + "\".");
            notification.setChannel("PUSH");
            notification.setReferenceId(savedRecord.getId());
            notification.setReferenceType("BORROW_RECORD");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }
=======
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
>>>>>>> origin/main

        return savedRecord;
    }

<<<<<<< HEAD
    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordRepository.findAll();
    }

    public List<BorrowRecord> getBorrowRecordsByUser(Integer userId) {
        return borrowRecordRepository.findByUserId(userId);
    }

    public List<BorrowRecord> getCurrentBorrows(Integer userId) {
        return borrowRecordRepository.findByUserIdAndStatus(userId, "BORROWED");
    }
=======
    // GET ALL BORROW RECORDS
    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordRepository.findAll();
    }
>>>>>>> origin/main
}