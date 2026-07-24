package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.security.CurrentUserProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BorrowRecordService {

    /** How many times a patron may renew before they must return the book. */
    private static final int MAX_RENEWALS = 2;

    /** A standard loan (and each renewal) runs this many days. */
    @Value("${library.loan-period-days:14}")
    private int loanPeriodDays;
    /** Overdue fine accrued per day late, in the institution's currency. */
    @Value("${library.fine-per-day:1.00}")
    private BigDecimal finePerDay;
    /** Cap on how large an overdue fine can grow. */
    @Value("${library.fine-max:20.00}")
    private BigDecimal fineMax;

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;
    private final BookCopyService bookCopyService;
    private final CurrentUserProvider currentUserProvider;
    private final FineService fineService;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                               BookRepository bookRepository,
                               NotificationService notificationService,
                               BookCopyService bookCopyService,
                               CurrentUserProvider currentUserProvider,
                               FineService fineService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.bookCopyService = bookCopyService;
        this.currentUserProvider = currentUserProvider;
        this.fineService = fineService;
    }

    @Transactional
    public BorrowRecord saveRecord(BorrowRecord rec) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
            rec.setId(null);
            // Medium: user_id has no DB-level nullable=false (unlike book_id, which already
            // had one), and nothing here checked it either - a request that omitted "user"
            // used to silently create an ownerless borrow record instead of failing.
            if (rec.getUser() == null || rec.getUser().getId() == null) {
                throw new IllegalArgumentException("user.id is required");
            }
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

        // Server-enforced loan period: every new loan is due in loanPeriodDays regardless of what
        // the client sent, so self-service borrows can't omit or fake the due date.
        rec.setDueDate(LocalDate.now().plusDays(loanPeriodDays));

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
        rec.setDueDate(LocalDate.now().plusDays(loanPeriodDays));

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

    /**
     * Self-service (or front-desk) renewal of an active loan, addressed by borrow-record id.
     * The caller must own the record or hold a staff role. Extends the due date by another
     * loan period, capped at {@link #MAX_RENEWALS} renewals, and refuses loans that are
     * already returned/lost or currently overdue (the patron must return/settle those first).
     */
    @Transactional
    public BorrowRecord renewRecord(Integer recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Borrow record not found with id: " + recordId));

        Integer ownerId = record.getUser() != null ? record.getUser().getId() : null;
        currentUserProvider.requireSelfOrAnyRole(ownerId, "LIBRARIAN", "ADMIN");

        String status = record.getStatus();
        if ("RETURNED".equals(status) || "LOST".equals(status)) {
            throw new IllegalStateException("This loan can no longer be renewed.");
        }
        if ("OVERDUE".equals(status)) {
            throw new IllegalStateException(
                    "Overdue books can't be renewed. Please return the book or settle any fine first.");
        }
        short renewals = record.getRenewalCount() == null ? 0 : record.getRenewalCount();
        if (renewals >= MAX_RENEWALS) {
            throw new IllegalStateException(
                    "Renewal limit reached (" + MAX_RENEWALS + "). Please return the book.");
        }

        // Extend from the later of today or the current due date, so an early renewal
        // doesn't shorten the loan and a just-in-time one still gets a full period.
        LocalDate base = (record.getDueDate() == null || record.getDueDate().isBefore(LocalDate.now()))
                ? LocalDate.now() : record.getDueDate();
        record.setDueDate(base.plusDays(loanPeriodDays));
        record.setRenewalCount((short) (renewals + 1));
        record.setStatus("RENEWED");
        BorrowRecord saved = borrowRecordRepository.save(record);

        String title = record.getBook() != null ? record.getBook().getTitle() : "your book";
        if (ownerId != null) {
            Notification notification = new Notification();
            notification.setUserId(ownerId);
            notification.setTitle("Loan Renewed");
            notification.setType("RENEW");
            notification.setMessage("Your loan of \"" + title + "\" was renewed. New due date: "
                    + saved.getDueDate() + ".");
            notification.setChannel("PUSH");
            notification.setReferenceId(saved.getId());
            notification.setReferenceType("BORROW_RECORD");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }

        return saved;
    }

    /**
     * Return a loan addressed by borrow-record id (the self-service / in-app path, as
     * opposed to {@link #checkInCopy} which is driven by a scanned physical barcode). The
     * caller must own the record or hold a staff role. Restores the book's available count
     * (and frees the physical copy when one is attached), and raises an overdue fine when
     * the book comes back late.
     */
    @Transactional
    public BorrowRecord returnRecord(Integer recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Borrow record not found with id: " + recordId));

        Integer ownerId = record.getUser() != null ? record.getUser().getId() : null;
        currentUserProvider.requireSelfOrAnyRole(ownerId, "LIBRARIAN", "ADMIN");

        if ("RETURNED".equals(record.getStatus())) {
            throw new IllegalStateException("This book has already been returned.");
        }

        if (record.getBookCopy() != null) {
            bookCopyService.setAvailability(record.getBookCopy(), true);
        }

        LocalDate dueDate = record.getDueDate();
        boolean late = dueDate != null && dueDate.isBefore(LocalDate.now());

        record.setStatus("RETURNED");
        record.setReturnedAt(LocalDateTime.now());
        BorrowRecord saved = borrowRecordRepository.save(record);

        // Locked read-then-write against Book (C5/H4), capped at totalCopies so a
        // duplicate/erroneous return can't inflate availableCopies past capacity.
        Book book = bookRepository.findByIdForUpdate(record.getBook().getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Book not found with id: " + record.getBook().getId()));
        int restored = (book.getAvailableCopies() == null ? 0 : book.getAvailableCopies()) + 1;
        int cap = book.getTotalCopies() == null ? restored : book.getTotalCopies();
        book.setAvailableCopies(Math.min(restored, cap));
        bookRepository.save(book);

        if (late && ownerId != null) {
            // Finalize the (possibly already-accruing) overdue fine to the final lateness — upsert
            // so the scheduler's daily fine isn't duplicated.
            long daysLate = ChronoUnit.DAYS.between(dueDate, LocalDate.now());
            upsertOverdueFine(saved.getId(), ownerId, book.getTitle(), daysLate);
        }

        if (ownerId != null) {
            Notification notification = new Notification();
            notification.setUserId(ownerId);
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

    /** Overdue fine for a given lateness: per-day rate × days, capped at the configured max. */
    private BigDecimal computeFine(long daysLate) {
        BigDecimal amount = finePerDay.multiply(BigDecimal.valueOf(Math.max(0, daysLate)));
        return amount.compareTo(fineMax) > 0 ? fineMax : amount;
    }

    /**
     * Keep exactly one overdue fine per loan, set to the current lateness. Reuses the loan's
     * existing UNPAID fine (so it grows day by day) or creates a new one.
     */
    private void upsertOverdueFine(Integer borrowId, Integer userId, String bookTitle, long daysLate) {
        BigDecimal amount = computeFine(daysLate);
        String reason = "Overdue: \"" + bookTitle + "\" (" + daysLate + " day(s) late).";
        Fine existing = fineService.findUnpaidByBorrowId(borrowId).orElse(null);
        if (existing != null) {
            existing.setAmount(amount);
            existing.setReason(reason);
            existing.setUpdatedAt(LocalDateTime.now());
            fineService.saveFine(existing);
        } else {
            Fine fine = new Fine();
            fine.setUserId(userId);
            fine.setBorrowId(borrowId);
            fine.setAmount(amount);
            fine.setStatus("UNPAID");
            fine.setReason(reason);
            fine.setDueDate(LocalDateTime.now().plusDays(loanPeriodDays));
            fineService.createFine(fine);
        }
    }

    /**
     * Daily assessment for one loan (called by {@link OverdueBookScheduler}): if it's still out and
     * past its due date, mark it OVERDUE and grow its fine to the current lateness. The patron is
     * notified only on the first OVERDUE flag (not every day). Returns true if the loan was overdue.
     */
    @Transactional
    public boolean assessOverdue(Integer recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId).orElse(null);
        if (record == null) {
            return false;
        }
        String status = record.getStatus();
        if ("RETURNED".equals(status) || "LOST".equals(status)) {
            return false;
        }
        LocalDate dueDate = record.getDueDate();
        if (dueDate == null || !dueDate.isBefore(LocalDate.now())) {
            return false;
        }

        long daysLate = ChronoUnit.DAYS.between(dueDate, LocalDate.now());
        boolean firstFlag = !"OVERDUE".equals(status);
        record.setStatus("OVERDUE");
        borrowRecordRepository.save(record);

        Integer ownerId = record.getUser() != null ? record.getUser().getId() : null;
        String title = record.getBook() != null ? record.getBook().getTitle() : "a book";
        if (ownerId != null) {
            upsertOverdueFine(record.getId(), ownerId, title, daysLate);
        }

        if (firstFlag && ownerId != null) {
            Notification notification = new Notification();
            notification.setUserId(ownerId);
            notification.setType("OVERDUE");
            notification.setTitle("Book Overdue");
            notification.setMessage("The book \"" + title + "\" was due on " + dueDate
                    + ". A fine now accrues each day until you return it.");
            notification.setChannel("PUSH");
            notification.setReferenceId(record.getId());
            notification.setReferenceType("BORROW_RECORD");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }
        return true;
    }
}