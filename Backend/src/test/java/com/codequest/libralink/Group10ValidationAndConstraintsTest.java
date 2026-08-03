package com.codequest.libralink;

import com.codequest.libralink.dto.BookRequest;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.StudentReadingProgress;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.UserAudioProgress;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.FinePaymentRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.StudentReadingProgressRepository;
import com.codequest.libralink.repository.UserAudioProgressRepository;
import com.codequest.libralink.service.BookService;
import com.codequest.libralink.service.BorrowRecordService;
import com.codequest.libralink.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Regression tests for the Group 10 remediation (Medium):
 * - Required-field gaps that used to fall through to a raw NPE/500 or a misleading 409
 *   "constraint violation" instead of a clean 400 naming the actual missing field.
 * - Missing unique constraints on find-or-create-style rows, which allowed concurrent
 *   requests to silently create duplicate rows instead of failing loudly.
 */
class Group10ValidationAndConstraintsTest extends BaseApiTest {

    @Autowired
    private UserService userService;

    @Autowired
    private BorrowRecordService borrowRecordService;

    @Autowired
    private BookService bookService;

    @Autowired
    private UserAudioProgressRepository userAudioProgressRepository;

    @Autowired
    private StudentReadingProgressRepository studentReadingProgressRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private FinePaymentRepository finePaymentRepository;

    @Autowired
    private BookRepository bookRepository;

    // --- Required-field gaps ---

    @Test
    void registerUser_missingPassword_throwsInsteadOfNpeOn500() {
        User user = new User();
        user.setFirstName("No");
        user.setLastName("Password");
        user.setEmail(uniqueEmail("g10nopass"));
        Institution inst = institutionRepository.save(
                new Institution("G10 Inst A", null, "BASIC", "Accra", null, null));
        user.setInstitution(inst);

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));
    }

    @Test
    void registerUser_missingFirstName_returns400NotDataIntegrityError() {
        User user = new User();
        user.setLastName("NoFirstName");
        user.setEmail(uniqueEmail("g10nofirst"));
        user.setPasswordHash("pass1234");
        Institution inst = institutionRepository.save(
                new Institution("G10 Inst B", null, "BASIC", "Accra", null, null));
        user.setInstitution(inst);

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(user));
    }

    @Test
    void saveRecord_missingUser_throwsInsteadOfCreatingOwnerlessLoan() {
        com.codequest.libralink.entity.Book book = new com.codequest.libralink.entity.Book();
        book.setInstitution(testInstitution());
        book.setTitle("G10 Ownerless Loan Book");
        book.setIsbn("978-10-" + (int) (Math.random() * 900000000 + 100000000) + "-1");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);

        com.codequest.libralink.entity.Book saved = bookRepository.save(book);

        BorrowRecord rec = new BorrowRecord();
        com.codequest.libralink.entity.Book bookRef = new com.codequest.libralink.entity.Book();
        bookRef.setId(saved.getId());
        rec.setBook(bookRef);
        // Deliberately no rec.setUser(...)
        rec.setStatus("BORROWED");
        rec.setDueDate(LocalDate.now().plusDays(14));

        assertThrows(IllegalArgumentException.class, () -> borrowRecordService.saveRecord(rec));
    }

    @Test
    void addBook_missingTitle_returns400NotDataIntegrityError() {
        BookRequest request = new BookRequest();
        request.setIsbn("978-10-" + (int) (Math.random() * 900000000 + 100000000) + "-2");

        assertThrows(IllegalArgumentException.class, () -> bookService.addBook(request));
    }

    // --- Missing unique constraints on find-or-create-style rows ---

    @Test
    void userAudioProgress_duplicateUserAndTrack_violatesUniqueConstraint() {
        UserAudioProgress first = new UserAudioProgress(9001, 9001, 10, false);
        first.setSchoolId(testInstitution().getInstitutionId());
        userAudioProgressRepository.saveAndFlush(first);

        UserAudioProgress duplicate = new UserAudioProgress(9001, 9001, 20, false);
        duplicate.setSchoolId(testInstitution().getInstitutionId());
        assertThrows(DataIntegrityViolationException.class,
                () -> userAudioProgressRepository.saveAndFlush(duplicate));
    }

    @Test
    void studentReadingProgress_duplicateStudentAndItem_violatesUniqueConstraint() {
        StudentReadingProgress first = StudentReadingProgress.builder()
                .studentId(9002).listItemId(9002).build();
        first.setSchoolId(testInstitution().getInstitutionId());
        studentReadingProgressRepository.saveAndFlush(first);

        StudentReadingProgress duplicate = StudentReadingProgress.builder()
                .studentId(9002).listItemId(9002).build();
        duplicate.setSchoolId(testInstitution().getInstitutionId());
        assertThrows(DataIntegrityViolationException.class,
                () -> studentReadingProgressRepository.saveAndFlush(duplicate));
    }

    @Test
    void institution_duplicateShortName_violatesUniqueConstraint() {
        String shortName = "G10SN" + System.nanoTime();
        institutionRepository.saveAndFlush(
                new Institution("G10 First Inst", shortName, "BASIC", "Accra", null, null));

        assertThrows(DataIntegrityViolationException.class, () -> institutionRepository.saveAndFlush(
                new Institution("G10 Second Inst", shortName, "BASIC", "Accra", null, null)));
    }

    @Test
    void institution_multipleNullShortNames_areAllowed() {
        institutionRepository.saveAndFlush(
                new Institution("G10 Null SN A", null, "BASIC", "Accra", null, null));
        // Must not throw - a plain unique column allows any number of NULLs.
        institutionRepository.saveAndFlush(
                new Institution("G10 Null SN B", null, "BASIC", "Accra", null, null));
    }

    @Test
    void finePayment_duplicateTransactionRef_violatesUniqueConstraint() {
        String ref = "G10REF" + System.nanoTime();
        finePaymentRepository.saveAndFlush(newFinePayment(9003, ref));

        assertThrows(DataIntegrityViolationException.class,
                () -> finePaymentRepository.saveAndFlush(newFinePayment(9004, ref)));
    }

    @Test
    void finePayment_multipleNullTransactionRefs_areAllowed() {
        finePaymentRepository.saveAndFlush(newFinePayment(9005, null));
        // Must not throw - cash/no-ref payments are unaffected.
        finePaymentRepository.saveAndFlush(newFinePayment(9006, null));
    }

    private FinePayment newFinePayment(Integer fineId, String transactionRef) {
        FinePayment payment = new FinePayment();
        payment.setFineId(fineId);
        payment.setUserId(fineId);
        payment.setSchoolId(testInstitution().getInstitutionId());
        payment.setAmount(BigDecimal.TEN);
        payment.setAmountPaid(BigDecimal.TEN);
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());
        payment.setCreatedAt(LocalDateTime.now());
        return payment;
    }
}
