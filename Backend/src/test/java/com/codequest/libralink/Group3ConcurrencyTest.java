package com.codequest.libralink;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.FinePaymentRepository;
import com.codequest.libralink.repository.FineRepository;
import com.codequest.libralink.security.AuthenticatedUser;
import com.codequest.libralink.service.BorrowRecordService;
import com.codequest.libralink.service.FinePaymentService;
import com.codequest.libralink.service.ReservationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Regression tests for the Group 3 concurrency/mass-assignment remediation (C5, H4):
 * the borrow/payment "read the current state, decide, then write" sequences must be
 * serialized with a DB row lock, and BorrowRecordService must never trust the
 * client-supplied Book sub-object.
 */
class Group3ConcurrencyTest extends BaseApiTest {

    @Autowired
    private BorrowRecordService borrowRecordService;

    @Autowired
    private FinePaymentService finePaymentService;

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private FinePaymentRepository finePaymentRepository;

    private Book newBook(String title, int totalCopies, int availableCopies) {
        Book book = new Book();
        book.setInstitution(testInstitution());
        book.setTitle(title);
        book.setIsbn("978-3-" + (int) (Math.random() * 900000000 + 100000000) + "-1");
        book.setTotalCopies(totalCopies);
        book.setAvailableCopies(availableCopies);
        book.setActive(true);
        return bookRepository.save(book);
    }

    /**
     * These tests call BorrowRecordService/ReservationService/FinePaymentService directly
     * (no mockMvc/JwtAuthenticationFilter), so SecurityContextHolder needs a principal for
     * SchoolContext-backed checks (e.g. BorrowRecordService.saveRecord's UserService.getUserById
     * call, or FinePaymentService.processPayment's assertSameSchool) - same pattern as
     * Group4AsyncTransactionTest.
     */
    private void authenticateAsStaffOf(Integer schoolId) {
        // userId must be non-null (never a real row id) - UserService.getUserById's
        // isSelf check calls caller.userId().equals(id) unconditionally.
        AuthenticatedUser principal = new AuthenticatedUser(
                -1, "concurrency-test@example.com", schoolId, List.of("LIBRARIAN"));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // --- C5: BorrowRecordService must not trust the client-supplied Book object ---

    @Test
    void saveRecord_ignoresClientSuppliedBookFields_usesServerState() {
        Book book = newBook("Race Test Book", 3, 3);
        User student = createTestStudent(uniqueEmail("g3stu"), "pass1234");

        // The client claims the book has 999 copies and a different title - none of
        // that should ever reach the database; only the real server-side row matters.
        Book tamperedBook = new Book();
        tamperedBook.setId(book.getId());
        tamperedBook.setTitle("HACKED TITLE");
        tamperedBook.setAvailableCopies(999);
        tamperedBook.setTotalCopies(999);

        BorrowRecord rec = new BorrowRecord();
        rec.setBook(tamperedBook);
        rec.setUser(student);
        rec.setStatus("BORROWED");
        rec.setDueDate(LocalDate.now().plusDays(14));

        authenticateAsStaffOf(testInstitution().getInstitutionId());
        borrowRecordService.saveRecord(rec);

        Book reloaded = bookRepository.findById(book.getId()).orElseThrow();
        assertEquals("Race Test Book", reloaded.getTitle(), "title must not be overwritten by client input");
        assertEquals(3, reloaded.getTotalCopies(), "totalCopies must not be overwritten by client input");
        assertEquals(2, reloaded.getAvailableCopies(), "availableCopies must be decremented server-side by exactly 1");
    }

    @Test
    void saveRecord_bookWithZeroServerCopies_throwsRegardlessOfClientClaim() {
        Book book = newBook("No Copies Book", 1, 0);
        User student = createTestStudent(uniqueEmail("g3stu2"), "pass1234");

        Book tamperedBook = new Book();
        tamperedBook.setId(book.getId());
        tamperedBook.setAvailableCopies(50); // client lies about availability

        BorrowRecord rec = new BorrowRecord();
        rec.setBook(tamperedBook);
        rec.setUser(student);
        rec.setStatus("BORROWED");
        rec.setDueDate(LocalDate.now().plusDays(14));

        authenticateAsStaffOf(testInstitution().getInstitutionId());
        assertThrows(IllegalStateException.class, () -> borrowRecordService.saveRecord(rec));
    }

    // --- C5: concurrent borrows of the last copy must not double-lend ---

    @Test
    void saveRecord_concurrentBorrows_onlyOneSucceedsForLastCopy() throws Exception {
        Book book = newBook("Last Copy Book", 1, 1);
        Integer bookId = book.getId();

        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger failures = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        Integer schoolId = testInstitution().getInstitutionId();
        for (int i = 0; i < threads; i++) {
            User student = createTestStudent(uniqueEmail("g3race" + i), "pass1234");
            futures.add(pool.submit(() -> {
                try {
                    authenticateAsStaffOf(schoolId);
                    ready.countDown();
                    go.await();
                    Book bookRef = new Book();
                    bookRef.setId(bookId);
                    BorrowRecord rec = new BorrowRecord();
                    rec.setBook(bookRef);
                    rec.setUser(student);
                    rec.setStatus("BORROWED");
                    rec.setDueDate(LocalDate.now().plusDays(14));
                    borrowRecordService.saveRecord(rec);
                    successes.incrementAndGet();
                } catch (Exception e) {
                    failures.incrementAndGet();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }));
        }

        ready.await();
        go.countDown();
        for (Future<?> f : futures) {
            f.get(15, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertEquals(1, successes.get(), "exactly one concurrent borrow should succeed for the last copy");
        assertEquals(threads - 1, failures.get());

        Book finalBook = bookRepository.findById(bookId).orElseThrow();
        assertEquals(0, finalBook.getAvailableCopies());
    }

    // --- H4: concurrent payments on the same fine must not double-pay ---

    @Test
    void processPayment_concurrentPaymentsOnSameFine_onlyOneSucceeds() throws Exception {
        User student = createTestStudent(uniqueEmail("g3fine"), "pass1234");
        Fine fine = new Fine();
        fine.setUserId(student.getId());
        fine.setSchoolId(testInstitution().getInstitutionId());
        fine.setAmount(new BigDecimal("15.00"));
        fine = fineRepository.save(fine);
        Integer fineId = fine.getId();
        Integer userId = student.getId();

        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger failures = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        Integer schoolId = testInstitution().getInstitutionId();
        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                try {
                    // SecurityContextHolder is thread-local; this test calls FinePaymentService
                    // directly (no mockMvc/JwtAuthenticationFilter), so each worker thread needs
                    // its own authenticated principal for FinePaymentService.processPayment's
                    // SchoolContext.assertSameSchool check - same pattern as Group4AsyncTransactionTest.
                    AuthenticatedUser principal = new AuthenticatedUser(
                            userId, "concurrency-test@example.com", schoolId, List.of("LIBRARIAN"));
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(principal, null, List.of()));
                    ready.countDown();
                    go.await();
                    FinePayment payment = new FinePayment();
                    payment.setFineId(fineId);
                    payment.setUserId(userId);
                    payment.setAmountPaid(new BigDecimal("15.00"));
                    finePaymentService.processPayment(payment);
                    successes.incrementAndGet();
                } catch (Exception e) {
                    failures.incrementAndGet();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }));
        }

        ready.await();
        go.countDown();
        for (Future<?> f : futures) {
            f.get(15, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertEquals(1, successes.get(), "exactly one concurrent payment should succeed on a fine");
        assertEquals(threads - 1, failures.get());

        Fine reloaded = fineRepository.findById(fineId).orElseThrow();
        assertEquals("PAID", reloaded.getStatus());
        assertEquals(1, finePaymentRepository.findByFineId(fineId).size(),
                "only one FinePayment row should have been recorded");
    }

    // --- H4: reservation availability must be decided from the locked server row ---

    @Test
    void createReservation_ignoresClientSuppliedAvailability_usesServerState() {
        Book book = newBook("Reservation Race Book", 1, 0); // server says no copies left
        User student = createTestStudent(uniqueEmail("g3res"), "pass1234");

        Book tamperedBook = new Book();
        tamperedBook.setId(book.getId());
        tamperedBook.setAvailableCopies(999); // client lies about availability

        Reservation reservation = new Reservation();
        reservation.setUserId(student.getId());
        reservation.setBook(tamperedBook);

        Reservation saved = reservationService.createReservation(reservation);

        assertEquals("PENDING", saved.getStatus(), "must fall back to PENDING based on the real server-side copy count");
    }
}
