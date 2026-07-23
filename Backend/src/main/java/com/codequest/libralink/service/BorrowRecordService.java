package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;
    private final BookCopyService bookCopyService;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                               BookRepository bookRepository,
                               NotificationService notificationService,
                               BookCopyService bookCopyService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.bookCopyService = bookCopyService;
    }

    @Transactional
    public BorrowRecord saveRecord(BorrowRecord rec) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        rec.setId(null);
        if (rec.getBook() == null || rec.getBook().getId() == null) {
            throw new IllegalArgumentException("book.id is required");
        }

        // Never trust the client-supplied Book sub-object (it can carry arbitrary
        // availableCopies/totalCopies/borrowCount/etc.) - re-fetch the real row instead,
        // with a DB row lock held for the rest of this transaction so a concurrent
        // borrow of the same book can't also read "available" and double-lend the last
        // copy (C5).
        Book book = bookRepository.findByIdForUpdate(rec.getBook().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Book not found with id: " + rec.getBook().getId()));
        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("Book is not available for borrowing.");
        }
        rec.setBook(book);

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        book.setBorrowCount((book.getBorrowCount() == null ? 0 : book.getBorrowCount()) + 1);
        bookRepository.save(book);

        BorrowRecord savedRecord = borrowRecordRepository.save(rec);

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

        return savedRecord;
    }

    public List<BorrowRecord> getAllBorrowRecords() {
        return borrowRecordRepository.findAll();
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

    /**
     * Front-desk check-out of a specific physical copy (H8): previously
     * CirculationController performed this by directly flipping the copy's flag and then
     * duplicating saveRecord's book-locking/decrement logic inline. Centralizing it here
     * means the circulation flow can never drift from the validation/notification logic
     * enforced on every other borrow path.
     */
    @Transactional
    public BorrowRecord checkOutCopy(BookCopy copy, User user) {
        if (copy == null || copy.getId() == null) {
            throw new IllegalArgumentException("A valid book copy is required.");
        }
        if (!copy.isAvailable()) {
            throw new IllegalStateException("This copy is not available for checkout.");
        }
        if (user == null) {
            throw new IllegalArgumentException("A valid user is required.");
        }

        bookCopyService.setAvailability(copy, false);

        BorrowRecord rec = new BorrowRecord();
        Book bookRef = new Book();
        bookRef.setId(copy.getBook().getId());
        rec.setBook(bookRef);
        rec.setBookCopy(copy);
        rec.setUser(user);
        rec.setStatus("BORROWED");
        rec.setDueDate(LocalDate.now().plusDays(14));

        // Delegates to the same locking/decrement/notification logic every other borrow
        // path uses (C5); saveRecord re-fetches and re-assigns the real Book row itself.
        return saveRecord(rec);
    }

    /**
     * Front-desk check-in of a specific physical copy (H8): previously
     * CirculationController marked the copy available and the borrow record RETURNED by
     * writing directly to BorrowRecordRepository, which never restored the Book's
     * availableCopies count - every check-out/check-in cycle through that endpoint
     * permanently shrank the book's available inventory. This method is now the single
     * place a physical return is recorded.
     */
    @Transactional
    public BorrowRecord checkInCopy(BookCopy copy) {
        if (copy == null || copy.getId() == null) {
            throw new IllegalArgumentException("A valid book copy is required.");
        }

        BorrowRecord record = borrowRecordRepository.findFirstByBookCopyIdAndStatus(copy.getId(), "BORROWED")
                .orElseThrow(() -> new IllegalStateException(
                        "No active BORROWED record found for copy id: " + copy.getId()));

        bookCopyService.setAvailability(copy, true);

        record.setStatus("RETURNED");
        record.setReturnedAt(LocalDateTime.now());
        BorrowRecord saved = borrowRecordRepository.save(record);

        // Locked for the rest of this transaction, consistent with every other
        // read-then-write path against Book (C5/H4); capped at totalCopies so a
        // duplicate/erroneous check-in can never inflate availableCopies past capacity.
        Book book = bookRepository.findByIdForUpdate(copy.getBook().getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Book not found with id: " + copy.getBook().getId()));
        int restored = (book.getAvailableCopies() == null ? 0 : book.getAvailableCopies()) + 1;
        int cap = book.getTotalCopies() == null ? restored : book.getTotalCopies();
        book.setAvailableCopies(Math.min(restored, cap));
        bookRepository.save(book);

        if (saved.getUser() != null) {
            Notification notification = new Notification();
            notification.setUserId(saved.getUser().getId());
            notification.setTitle("Book Returned");
            notification.setType("RETURN");
            notification.setMessage("You have successfully returned \"" + book.getTitle() + "\".");
            notification.setChannel("PUSH");
            notification.setReferenceId(saved.getId());
            notification.setReferenceType("BORROW_RECORD");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }

        return saved;
    }
}