package com.codequest.libralink;

import com.codequest.libralink.entity.*;
import com.codequest.libralink.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Core "can a School Admin/Librarian at School A see School B's data" isolation suite for
 * the multi-tenant retrofit, plus explicit regressions guarding the deliberate exceptions
 * (anonymous catalogue browsing stays unscoped; PLATFORM_SUPER_ADMIN sees everything).
 */
class CrossSchoolIsolationTest extends BaseApiTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private PickupSlotRepository pickupSlotRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SearchLogRepository searchLogRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ReadingListRepository readingListRepository;

    @Autowired
    private ReadingListItemRepository readingListItemRepository;

    @Autowired
    private StudentReadingProgressRepository studentReadingProgressRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    @Autowired
    private ExamQuestionRepository examQuestionRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private StudySummaryRepository studySummaryRepository;

    @Autowired
    private VoiceCommandRepository voiceCommandRepository;

    @Autowired
    private com.codequest.libralink.service.AudioTrackService audioTrackService;

    private Institution schoolA;
    private Institution schoolB;
    private String librarianAEmail;
    private String librarianBEmail;
    private Integer librarianBId;
    private String librarianAToken;
    private String librarianBToken;
    private User studentA;
    private Book bookA;
    private Book bookB;
    private BookCopy copyA;
    private BookCopy copyB;
    private ReadingListItem itemA;
    private ReadingListItem itemB;
    private Fine fineA;
    private Fine fineB;
    private StudySummary summaryA;
    private StudySummary summaryB;
    private Course courseA;
    private ReadingList listA;

    @BeforeEach
    void setUp() throws Exception {
        schoolA = createSchool("School A", "SCHA-" + System.nanoTime());
        schoolB = createSchool("School B", "SCHB-" + System.nanoTime());

        librarianAEmail = uniqueEmail("liba");
        librarianBEmail = uniqueEmail("libb");
        createTestLibrarianForSchool(schoolA, librarianAEmail, "pass1234");
        User librarianB = createTestLibrarianForSchool(schoolB, librarianBEmail, "pass1234");
        librarianBId = librarianB.getId();

        librarianAToken = loginAs(librarianAEmail, "pass1234");
        librarianBToken = loginAs(librarianBEmail, "pass1234");

        studentA = createTestStudentForSchool(schoolA, uniqueEmail("stua"), "pass1234");

        bookA = new Book();
        bookA.setTitle("School A Book");
        bookA.setIsbn("A-" + System.nanoTime());
        bookA.setTotalCopies(3);
        bookA.setAvailableCopies(3);
        bookA.setActive(true);
        bookA.setInstitution(schoolA);
        bookA = bookRepository.save(bookA);

        bookB = new Book();
        bookB.setTitle("School B Book");
        bookB.setIsbn("B-" + System.nanoTime());
        bookB.setTotalCopies(2);
        bookB.setAvailableCopies(2);
        bookB.setActive(true);
        bookB.setInstitution(schoolB);
        bookB = bookRepository.save(bookB);

        BorrowRecord recordA = new BorrowRecord();
        recordA.setUser(studentA);
        recordA.setBook(bookA);
        recordA.setSchoolId(schoolA.getInstitutionId());
        recordA.setStatus("BORROWED");
        recordA.setDueDate(LocalDate.now().plusDays(14));
        borrowRecordRepository.save(recordA);

        // studentA also has a School B loan on the books (mirrors the fine/reservation/etc.
        // "same user id, two schools" sweep fixtures below) so the by-user borrow-record
        // endpoints have something cross-school to wrongly leak if the school filter regresses.
        BorrowRecord recordB = new BorrowRecord();
        recordB.setUser(studentA);
        recordB.setBook(bookB);
        recordB.setSchoolId(schoolB.getInstitutionId());
        recordB.setStatus("BORROWED");
        recordB.setDueDate(LocalDate.now().plusDays(14));
        borrowRecordRepository.save(recordB);

        seedSweepFixtures();
    }

    /** Fixtures for the ~16-entity read-scoping sweep (Issue 2 of the known-gaps plan) -
     *  one row per school per entity, keyed off studentA's id where a userId is needed so
     *  the same student id can double as "school A's user" across all the user-scoped
     *  endpoints below. */
    private void seedSweepFixtures() {
        Integer schoolAId = schoolA.getInstitutionId();
        Integer schoolBId = schoolB.getInstitutionId();
        Integer studentAId = studentA.getId();

        fineA = new Fine();
        fineA.setUserId(studentAId);
        fineA.setSchoolId(schoolAId);
        fineA.setAmount(new BigDecimal("5.00"));
        fineA = fineRepository.save(fineA);
        fineB = new Fine();
        fineB.setUserId(studentAId);
        fineB.setSchoolId(schoolBId);
        fineB.setAmount(new BigDecimal("7.00"));
        fineB = fineRepository.save(fineB);

        Notification notifA = new Notification();
        notifA.setUserId(studentAId);
        notifA.setSchoolId(schoolAId);
        notifA.setType("GENERAL");
        notifA.setTitle("A");
        notifA.setMessage("School A notification");
        notificationRepository.save(notifA);
        Notification notifB = new Notification();
        notifB.setUserId(studentAId);
        notifB.setSchoolId(schoolBId);
        notifB.setType("GENERAL");
        notifB.setTitle("B");
        notifB.setMessage("School B notification");
        notificationRepository.save(notifB);

        Reservation reservationA = new Reservation();
        reservationA.setUserId(studentAId);
        reservationA.setSchoolId(schoolAId);
        reservationA.setBook(bookA);
        reservationA = reservationRepository.save(reservationA);
        Reservation reservationB = new Reservation();
        reservationB.setUserId(studentAId);
        reservationB.setSchoolId(schoolBId);
        reservationB.setBook(bookB);
        reservationB = reservationRepository.save(reservationB);

        PickupSlot slotA = new PickupSlot();
        slotA.setUserId(studentAId);
        slotA.setSchoolId(schoolAId);
        slotA.setReservationId(reservationA.getId());
        slotA.setQrCode("QR-A-" + System.nanoTime());
        slotA.setScheduledAt(LocalDateTime.now());
        pickupSlotRepository.save(slotA);
        PickupSlot slotB = new PickupSlot();
        slotB.setUserId(studentAId);
        slotB.setSchoolId(schoolBId);
        slotB.setReservationId(reservationB.getId());
        slotB.setQrCode("QR-B-" + System.nanoTime());
        slotB.setScheduledAt(LocalDateTime.now());
        pickupSlotRepository.save(slotB);

        AuditLog auditA = new AuditLog();
        auditA.setUserId(studentAId);
        auditA.setSchoolId(schoolAId);
        auditA.setAction("LOGIN");
        auditA.setEntityType("USER");
        auditA.setEntityId(studentAId);
        auditLogRepository.save(auditA);
        AuditLog auditB = new AuditLog();
        auditB.setUserId(studentAId);
        auditB.setSchoolId(schoolBId);
        auditB.setAction("LOGIN");
        auditB.setEntityType("USER");
        auditB.setEntityId(studentAId);
        auditLogRepository.save(auditB);

        SearchLog searchA = new SearchLog();
        searchA.setUserId(studentAId);
        searchA.setSchoolId(schoolAId);
        searchA.setQuery("school a query");
        searchA.setSearchType("TEXT");
        searchLogRepository.save(searchA);
        SearchLog searchB = new SearchLog();
        searchB.setUserId(studentAId);
        searchB.setSchoolId(schoolBId);
        searchB.setQuery("school b query");
        searchB.setSearchType("TEXT");
        searchLogRepository.save(searchB);

        courseA = new Course();
        courseA.setInstitution(schoolA);
        courseA.setName("Course A");
        courseA.setCode("CA-" + System.nanoTime());
        courseA = courseRepository.save(courseA);
        Course courseB = new Course();
        courseB.setInstitution(schoolB);
        courseB.setName("Course B");
        courseB.setCode("CB-" + System.nanoTime());
        courseB = courseRepository.save(courseB);

        listA = new ReadingList();
        listA.setCourseId(courseA.getId());
        listA.setSchoolId(schoolAId);
        listA.setTitle("Reading List A");
        listA = readingListRepository.save(listA);
        ReadingList listB = new ReadingList();
        listB.setCourseId(courseB.getId());
        listB.setSchoolId(schoolBId);
        listB.setTitle("Reading List B");
        listB = readingListRepository.save(listB);

        itemA = new ReadingListItem();
        itemA.setReadingListId(listA.getId());
        itemA.setSchoolId(schoolAId);
        itemA.setBookId(bookA.getId());
        itemA = readingListItemRepository.save(itemA);
        itemB = new ReadingListItem();
        itemB.setReadingListId(listB.getId());
        itemB.setSchoolId(schoolBId);
        itemB.setBookId(bookB.getId());
        itemB = readingListItemRepository.save(itemB);

        StudentReadingProgress progressA = new StudentReadingProgress();
        progressA.setStudentId(studentAId);
        progressA.setListItemId(itemA.getId());
        progressA.setSchoolId(schoolAId);
        studentReadingProgressRepository.save(progressA);
        StudentReadingProgress progressB = new StudentReadingProgress();
        progressB.setStudentId(studentAId);
        progressB.setListItemId(itemB.getId());
        progressB.setSchoolId(schoolBId);
        studentReadingProgressRepository.save(progressB);

        copyA = new BookCopy();
        copyA.setBook(bookA);
        copyA.setSchoolId(schoolAId);
        copyA.setBarcode("BC-A-" + System.nanoTime());
        copyA = bookCopyRepository.save(copyA);
        copyB = new BookCopy();
        copyB.setBook(bookB);
        copyB.setSchoolId(schoolBId);
        copyB.setBarcode("BC-B-" + System.nanoTime());
        copyB = bookCopyRepository.save(copyB);

        ExamQuestion questionA = new ExamQuestion();
        questionA.setBookId(bookA.getId());
        questionA.setUserId(studentAId);
        questionA.setSchoolId(schoolAId);
        questionA.setQuestion("Q for school A");
        questionA.setCorrectAnswer("A");
        questionA.setSessionId(1);
        examQuestionRepository.save(questionA);
        ExamQuestion questionB = new ExamQuestion();
        questionB.setBookId(bookB.getId());
        questionB.setUserId(studentAId);
        questionB.setSchoolId(schoolBId);
        questionB.setQuestion("Q for school B");
        questionB.setCorrectAnswer("B");
        questionB.setSessionId(1);
        examQuestionRepository.save(questionB);

        StudySession sessionA = new StudySession();
        sessionA.setUserId(studentAId);
        sessionA.setBookId(bookA.getId());
        sessionA.setSchoolId(schoolAId);
        studySessionRepository.save(sessionA);
        StudySession sessionB = new StudySession();
        sessionB.setUserId(studentAId);
        sessionB.setBookId(bookB.getId());
        sessionB.setSchoolId(schoolBId);
        studySessionRepository.save(sessionB);

        summaryA = new StudySummary();
        summaryA.setBookId(bookA.getId());
        summaryA.setUserId(studentAId);
        summaryA.setSchoolId(schoolAId);
        summaryA.setTitle("Summary A");
        summaryA = studySummaryRepository.save(summaryA);
        summaryB = new StudySummary();
        summaryB.setBookId(bookB.getId());
        summaryB.setUserId(studentAId);
        summaryB.setSchoolId(schoolBId);
        summaryB.setTitle("Summary B");
        summaryB = studySummaryRepository.save(summaryB);

        VoiceCommand voiceA = new VoiceCommand();
        voiceA.setUserId(studentAId);
        voiceA.setSchoolId(schoolAId);
        voiceA.setTranscribedText("search for school A books");
        voiceCommandRepository.save(voiceA);
        VoiceCommand voiceB = new VoiceCommand();
        voiceB.setUserId(studentAId);
        voiceB.setSchoolId(schoolBId);
        voiceB.setTranscribedText("search for school B books");
        voiceCommandRepository.save(voiceB);
    }

    @Test
    void librarianA_cannotSeeSchoolBUsers() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", not(hasItem(librarianBEmail))));
    }

    @Test
    void staffEndpoint_excludesStudents() throws Exception {
        mockMvc.perform(get("/api/users/staff")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem(librarianAEmail)))
                .andExpect(jsonPath("$[*].email", not(hasItem(studentA.getEmail()))));
    }

    @Test
    void staffEndpoint_stillSchoolScoped() throws Exception {
        mockMvc.perform(get("/api/users/staff")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", not(hasItem(librarianBEmail))));
    }

    @Test
    void librarianA_cannotFetchSchoolBUserById() throws Exception {
        mockMvc.perform(get("/api/users/" + librarianBId)
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void studentCanAlwaysFetchOwnRecord() throws Exception {
        String studentToken = loginAs(studentA.getEmail(), "pass1234");
        mockMvc.perform(get("/api/users/" + studentA.getId())
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(studentA.getEmail()));
    }

    @Test
    void librarianA_cannotSeeSchoolBBorrowRecords() throws Exception {
        mockMvc.perform(get("/api/borrow-records")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].book.title", not(hasItem("School B Book"))))
                .andExpect(jsonPath("$[*].book.title", hasItem("School A Book")));
    }

    @Test
    void librarianA_cannotSeeSchoolBBorrowRecordsByUser() throws Exception {
        // studentA has a loan in both School A and School B (see setUp); a School A
        // librarian looking up studentA's records by userId must only see the School A one.
        mockMvc.perform(get("/api/borrow-records/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].book.title", not(hasItem("School B Book"))))
                .andExpect(jsonPath("$[*].book.title", hasItem("School A Book")));

        mockMvc.perform(get("/api/borrow-records/user/" + studentA.getId() + "/current")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].book.title", not(hasItem("School B Book"))))
                .andExpect(jsonPath("$[*].book.title", hasItem("School A Book")));
    }

    @Test
    void librarianA_cannotCreateLoanForSchoolBUser() throws Exception {
        // librarianB is a real School B user id; librarianA (School A staff) must not be
        // able to create a loan against it, even for a School A book.
        mockMvc.perform(post("/api/borrow-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianAToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "user", java.util.Map.of("id", librarianBId),
                                "book", java.util.Map.of("id", bookA.getId()),
                                "status", "BORROWED",
                                "dueDate", LocalDate.now().plusDays(14).toString()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void librarianA_cannotAssignRoleToSchoolBUser() throws Exception {
        // librarianB is a real School B user id; librarianA (School A staff) must not be
        // able to grant them a role - previously RoleService.assignRoleToUser skipped the
        // school check every other by-id lookup in UserService performs, letting a School
        // A librarian hand out ADMIN (full School Admin dashboard access) to a School B user.
        mockMvc.perform(post("/api/users/" + librarianBId + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianAToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("role", "ADMIN"))))
                .andExpect(status().isNotFound());

        User librarianB = userRepository.findById(librarianBId).orElseThrow();
        assertEquals(false, librarianB.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN")));
    }

    @Test
    void authenticatedLibrarian_seesOnlyOwnSchoolBooks() throws Exception {
        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School A Book")))
                .andExpect(jsonPath("$[*].title", not(hasItem("School B Book"))));

        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(librarianBToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School B Book")))
                .andExpect(jsonPath("$[*].title", not(hasItem("School A Book"))));
    }

    /** Regression guard: the deliberate "no behavior change for anonymous browsing" decision. */
    @Test
    void getAllBooks_unauthenticated_stillReturnsEverySchool() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School A Book")))
                .andExpect(jsonPath("$[*].title", hasItem("School B Book")));
    }

    @Test
    void librarianA_cannotFetchSchoolBBookById() throws Exception {
        mockMvc.perform(get("/api/books/" + bookB.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isNotFound());
    }

    /** Regression guard: the deliberate "no behavior change for anonymous browsing" decision. */
    @Test
    void getBookById_unauthenticated_stillWorks() throws Exception {
        mockMvc.perform(get("/api/books/" + bookB.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("School B Book"));
    }

    @Test
    void authenticatedLibrarian_searchExcludesOtherSchoolBooks() throws Exception {
        mockMvc.perform(get("/api/books/search").param("subject", "School"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School A Book")))
                .andExpect(jsonPath("$[*].title", hasItem("School B Book")));

        mockMvc.perform(get("/api/books/search")
                        .param("subject", "School")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School A Book")))
                .andExpect(jsonPath("$[*].title", not(hasItem("School B Book"))));
    }

    @Test
    void authenticatedLibrarian_naturalLanguageSearchExcludesOtherSchoolBooks() throws Exception {
        mockMvc.perform(get("/api/books/search")
                        .param("q", "books about School")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", not(hasItem("School B Book"))));
    }

    @Test
    void librarianA_cannotSeeSchoolBFinesNotificationsOrPickupSlots() throws Exception {
        mockMvc.perform(get("/api/fines/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));

        mockMvc.perform(get("/api/notifications/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/pickup-slots/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/pickup-slots/scheduled")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));
    }

    @Test
    void librarianA_cannotSeeSchoolBReservationsByUser() throws Exception {
        // reservationA/reservationB (seeded in seedSweepFixtures) are both tagged to
        // studentA's id but belong to different schools.
        mockMvc.perform(get("/api/reservations/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));
    }

    @Test
    void librarianA_issuingFine_ignoresClientSuppliedSchoolId() throws Exception {
        // Even if the client explicitly requests School B, a School A librarian's fine
        // must land on School A - the server must not trust a client-supplied schoolId.
        var result = mockMvc.perform(post("/api/fines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianAToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "userId", studentA.getId(),
                                "amount", new BigDecimal("3.00"),
                                "reason", "Test fine",
                                "schoolId", schoolB.getInstitutionId()))))
                .andExpect(status().isCreated())
                .andReturn();

        var saved = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(schoolA.getInstitutionId(), saved.get("schoolId").asInt());
        assertNotEquals(schoolB.getInstitutionId(), saved.get("schoolId").asInt());
    }

    @Test
    void librarianA_cannotSeeSchoolBAuditOrSearchLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/audit-logs/entity/USER/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/audit-logs/action/LOGIN")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/analytics/search-logs/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/analytics/search-logs/type/TEXT")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/analytics/search-logs/date-range")
                        .param("from", LocalDateTime.now().minusHours(1).toString())
                        .param("to", LocalDateTime.now().plusHours(1).toString())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));
    }

    @Test
    void librarianB_cannotSeeSchoolAReadingListsItemsOrProgress() throws Exception {
        mockMvc.perform(get("/api/reading-lists/course/" + courseA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("Reading List A")));

        mockMvc.perform(get("/api/reading-lists/course/" + courseA.getId())
                        .header("Authorization", bearerToken(librarianBToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", not(hasItem("Reading List A"))));

        mockMvc.perform(get("/api/reading_list_items/list/" + listA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].bookId", hasItem(bookA.getId())));

        mockMvc.perform(get("/api/reading_list_items/list/" + listA.getId())
                        .header("Authorization", bearerToken(librarianBToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].bookId", not(hasItem(bookA.getId()))));

        mockMvc.perform(get("/api/reading-progress/student/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));
    }

    @Test
    void librarianA_cannotSeeSchoolBBookCopies() throws Exception {
        mockMvc.perform(get("/api/book-copies")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].barcode", hasItem(copyA.getBarcode())))
                .andExpect(jsonPath("$[*].barcode", not(hasItem(copyB.getBarcode()))));

        mockMvc.perform(get("/api/book-copies/barcode/" + copyB.getBarcode())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/book-copies/barcode/" + copyA.getBarcode())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk());
    }

    @Test
    void librarianA_cannotSeeSchoolBExamOrStudyData() throws Exception {
        mockMvc.perform(get("/api/exam/summaries/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/exam/summary/" + summaryB.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/exam/summary/" + summaryA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/exam/sessions/1/questions")
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));

        mockMvc.perform(get("/api/exam/sessions/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))));
    }

    @Test
    void librarianA_cannotSeeSchoolBVoiceCommands() throws Exception {
        mockMvc.perform(get("/api/voice/history/user/" + studentA.getId())
                        .header("Authorization", bearerToken(librarianAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].schoolId", not(hasItem(schoolB.getInstitutionId()))))
                .andExpect(jsonPath("$[*].schoolId", hasItem(schoolA.getInstitutionId())));
    }

    @Test
    void platformSuperAdmin_seesAcrossAllSchools() throws Exception {
        String platformEmail = uniqueEmail("platform");
        createTestPlatformSuperAdmin(platformEmail, "pass1234");
        String platformToken = loginAs(platformEmail, "pass1234");

        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken(platformToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("School A Book")))
                .andExpect(jsonPath("$[*].title", hasItem("School B Book")));

        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(platformToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem(studentA.getEmail())));
    }

    @Test
    void platformSuperAdmin_staffEndpoint_seesAcrossAllSchools() throws Exception {
        String platformEmail = uniqueEmail("platform");
        createTestPlatformSuperAdmin(platformEmail, "pass1234");
        String platformToken = loginAs(platformEmail, "pass1234");

        mockMvc.perform(get("/api/users/staff")
                        .header("Authorization", bearerToken(platformToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem(librarianAEmail)))
                .andExpect(jsonPath("$[*].email", hasItem(librarianBEmail)))
                .andExpect(jsonPath("$[*].email", not(hasItem(studentA.getEmail()))));
    }

    // --- Paystack payments / real AI-TTS: schoolId stamped on write. Neither
    // FinePaymentController nor AudioController exposes a cross-school read endpoint (fine
    // payments have no list endpoint at all; audio conversions are ownership-scoped rather
    // than school-scoped, matching the documented /api/audio/** exception - see
    // NEXT_STEPS.md), so these verify the write-side tagging directly instead of via HTTP,
    // guarding the data for whenever a school-scoped read is added on top of it. ---

    @Test
    void finePaymentService_stampsSchoolIdFromTheFineBeingPaid() throws Exception {
        // librarianB is School B's own librarian, so this must succeed and the resulting
        // payment must be tagged to School B, not School A.
        var result = mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianBToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "fineId", fineB.getId(),
                                "userId", fineB.getUserId(),
                                "amountPaid", fineB.getAmount(),
                                "paymentMethod", "CASH"))))
                .andExpect(status().isCreated())
                .andReturn();

        var saved = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(schoolB.getInstitutionId(), saved.get("schoolId").asInt());
        assertNotEquals(schoolA.getInstitutionId(), saved.get("schoolId").asInt());
    }

    @Test
    void librarianA_cannotPaySchoolBFine() throws Exception {
        mockMvc.perform(post("/api/fine-payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianAToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "fineId", fineB.getId(),
                                "userId", fineB.getUserId(),
                                "amountPaid", fineB.getAmount(),
                                "paymentMethod", "CASH"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void audioTrackService_stampsSchoolIdFromTheSourceBook() {
        AudioTrack track = audioTrackService.initiateConversion(
                bookB.getId(), studentA.getId(), "en-US-Standard-A", "en-US",
                "Content for the cross-school audio conversion regression test.");

        assertEquals(schoolB.getInstitutionId(), track.getSchoolId());
        assertNotEquals(schoolA.getInstitutionId(), track.getSchoolId());
    }

    @Test
    void askLibra_doesNotLeakOtherSchoolBooksIntoRecommendations() throws Exception {
        // No AI_API_KEY in the test environment, so AiService falls back to its canned
        // intent engine - a "book"/"recommend" prompt routes through handleRecommendationQuery,
        // which must only draw from the caller's own school's catalogue.
        String studentToken = loginAs(studentA.getEmail(), "pass1234");
        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "prompt", "Can you recommend a book to read?"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestedBooks[*].title", not(hasItem("School B Book"))));
    }
}
