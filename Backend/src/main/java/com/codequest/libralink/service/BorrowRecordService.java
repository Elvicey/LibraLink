package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;
    private final SchoolContext schoolContext;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                               BookRepository bookRepository,
                               NotificationService notificationService,
                               SchoolContext schoolContext) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public BorrowRecord saveRecord(BorrowRecord rec) {
        // A client-supplied Book sub-object may only carry a few fields (e.g.
        // {"book":{"id":3}}), so always re-fetch the real row rather than trusting -
        // or, worse, merging via bookRepository.save() - a partial deserialized object,
        // which would silently null out every field the client didn't send (including
        // institution_id, now NOT NULL).
        Book book = rec.getBook() != null && rec.getBook().getId() != null
                ? bookRepository.findById(rec.getBook().getId()).orElse(null)
                : null;
        if (book != null && book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("Book is not available for borrowing.");
        }
        rec.setBook(book);
        rec.setSchoolId(book != null && book.getInstitution() != null
                ? book.getInstitution().getInstitutionId() : null);

        BorrowRecord savedRecord = borrowRecordRepository.save(rec);

        if (book != null) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
            book.setBorrowCount(book.getBorrowCount() + 1);
            bookRepository.save(book);
        }

        if (rec.getUser() != null) {
            Notification notification = new Notification();
            notification.setUserId(rec.getUser().getId());
            notification.setSchoolId(rec.getSchoolId());
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

        return savedRecord;
    }

    /** Staff sees only their own school's borrow records; PLATFORM_SUPER_ADMIN sees everyone. */
    public List<BorrowRecord> getAllBorrowRecords() {
        if (schoolContext.isPlatformSuperAdmin()) {
            return borrowRecordRepository.findAll();
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return borrowRecordRepository.findAll().stream()
                .filter(r -> schoolId.equals(r.getSchoolId()))
                .toList();
    }

    public List<BorrowRecord> getBorrowRecordsByUser(Integer userId) {
        return borrowRecordRepository.findByUserId(userId);
    }

    public List<BorrowRecord> getCurrentBorrows(Integer userId) {
        return borrowRecordRepository.findByUserIdAndStatusIn(
                userId,
                List.of("BORROWED", "OVERDUE", "RENEWED")
        );
    }
}