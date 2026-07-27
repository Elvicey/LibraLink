package com.codequest.libralink.config;

import com.codequest.libralink.entity.AudioBookTrack;
import com.codequest.libralink.entity.Author;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.Course;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.AudioBookTrackRepository;
import com.codequest.libralink.repository.AuthorRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.repository.CourseRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.ReadingListItemRepository;
import com.codequest.libralink.repository.ReadingListRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final InstitutionRepository institutionRepository;
    private final CourseRepository courseRepository;
    private final ReadingListRepository readingListRepository;
    private final ReadingListItemRepository readingListItemRepository;
    private final AudioBookTrackRepository audioBookTrackRepository;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder,
                      BookRepository bookRepository,
                      AuthorRepository authorRepository,
                      BorrowRecordRepository borrowRecordRepository,
                      InstitutionRepository institutionRepository,
                      CourseRepository courseRepository,
                      ReadingListRepository readingListRepository,
                      ReadingListItemRepository readingListItemRepository,
                      AudioBookTrackRepository audioBookTrackRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.institutionRepository = institutionRepository;
        this.courseRepository = courseRepository;
        this.readingListRepository = readingListRepository;
        this.readingListItemRepository = readingListItemRepository;
        this.audioBookTrackRepository = audioBookTrackRepository;
    }

    @Override
    public void run(String... args) {
        // Institution (= School) is seeded first: every non-platform-admin user/book below
        // must belong to one, per the multi-tenant retrofit's school-required invariant.
        Institution knust = seedInstitution();
        seedAdmin(knust);
        seedDemoStudent(knust);
        seedCatalogBooks(knust);
        tagExistingLiteratureBooks();
        seedDemoBorrows(knust);
        seedLectureCourses(knust);
        seedAudioBookTracks(knust);
    }

    private void seedAdmin(Institution institution) {
        String adminEmail = "admin@libralink.com";
        String adminPassword = "admin123";

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN")));

        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setActive(true);
            admin.setInstitution(institution);
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);
            userRepository.save(admin);
        } else {
            boolean needsSave = false;
            if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                Set<Role> roles = admin.getRoles();
                if (roles == null) roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                admin.setActive(true);
                needsSave = true;
            }
            if (admin.getInstitution() == null) {
                admin.setInstitution(institution);
                needsSave = true;
            }
            if (needsSave) {
                userRepository.save(admin);
            }
        }
    }

    private void seedDemoStudent(Institution institution) {
        String email = "student@libralink.com";
        User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null) {
            if (existing.getInstitution() == null) {
                existing.setInstitution(institution);
                userRepository.save(existing);
            }
            return;
        }
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseGet(() -> roleRepository.save(new Role("STUDENT")));
        User student = new User();
        student.setFirstName("Ama");
        student.setLastName("Student");
        student.setEmail(email);
        student.setPasswordHash(passwordEncoder.encode("student123"));
        student.setActive(true);
        student.setInstitution(institution);
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);
        student.setRoles(roles);
        userRepository.save(student);
    }

    private void seedDemoBorrows(Institution institution) {
        User student = userRepository.findByEmailIgnoreCase("student@libralink.com").orElse(null);
        if (student == null || !borrowRecordRepository.findByUserId(student.getId()).isEmpty()) {
            return;
        }
        Book calculus = bookRepository.findFirstByTitleIgnoreCase("Introduction to Calculus").orElse(null);
        Book tfa = bookRepository.findFirstByTitleIgnoreCase("Things Fall Apart").orElse(null);
        Book data = bookRepository.findFirstByTitleIgnoreCase("Data Structures in Practice").orElse(null);

        if (calculus != null) {
            BorrowRecord active = new BorrowRecord();
            active.setUser(student);
            active.setBook(calculus);
            active.setSchoolId(institution.getInstitutionId());
            active.setStatus("BORROWED");
            active.setBorrowedAt(LocalDateTime.now().minusDays(3));
            active.setDueDate(LocalDate.now().plusDays(11));
            borrowRecordRepository.save(active);
        }
        if (tfa != null) {
            BorrowRecord returned = new BorrowRecord();
            returned.setUser(student);
            returned.setBook(tfa);
            returned.setSchoolId(institution.getInstitutionId());
            returned.setStatus("RETURNED");
            returned.setBorrowedAt(LocalDateTime.now().minusDays(40));
            returned.setDueDate(LocalDate.now().minusDays(26));
            returned.setReturnedAt(LocalDateTime.now().minusDays(28));
            borrowRecordRepository.save(returned);
        }
        if (data != null) {
            BorrowRecord overdue = new BorrowRecord();
            overdue.setUser(student);
            overdue.setBook(data);
            overdue.setSchoolId(institution.getInstitutionId());
            overdue.setStatus("OVERDUE");
            overdue.setBorrowedAt(LocalDateTime.now().minusDays(20));
            overdue.setDueDate(LocalDate.now().minusDays(6));
            borrowRecordRepository.save(overdue);
        }
    }

    private void seedCatalogBooks(Institution institution) {
        ensureBook(institution, "Introduction to Calculus", "James Stewart", "Science",
                "Subject: Science. Core calculus text covering limits, derivatives, and integrals for undergraduate science students.",
                "9781285741550", (short) 2015, 8, 5);
        ensureBook(institution, "University Physics", "Hugh D. Young", "Science",
                "Subject: Science. Mechanics, waves, thermodynamics, and electromagnetism for first-year physics.",
                "9780321973610", (short) 2019, 6, 4);
        ensureBook(institution, "Organic Chemistry Essentials", "Paula Bruice", "Science",
                "Subject: Science. Foundations of organic chemistry with campus lab applications.",
                "9780134042282", (short) 2016, 5, 3);

        ensureBook(institution, "Data Structures in Practice", "Michael T. Goodrich", "Computing",
                "Subject: Computing. Arrays, trees, graphs, hashing, and algorithm analysis for CS courses.",
                "9781118771334", (short) 2014, 10, 7);
        ensureBook(institution, "Introduction to Algorithms", "Thomas H. Cormen", "Computing",
                "Subject: Computing. Classic algorithms reference used across computing departments.",
                "9780262046305", (short) 2022, 7, 4);
        ensureBook(institution, "Database System Concepts", "Abraham Silberschatz", "Computing",
                "Subject: Computing. Relational models, SQL, transactions, and modern database design.",
                "9780078022159", (short) 2019, 6, 4);

        ensureBook(institution, "Principles of Economics", "N. Gregory Mankiw", "Economics",
                "Subject: Economics. Micro and macro foundations for introductory economics modules.",
                "9780357133491", (short) 2020, 9, 6);
        ensureBook(institution, "Development Economics", "Debraj Ray", "Economics",
                "Subject: Economics. Growth, poverty, inequality, and development policy for African campuses.",
                "9780691017068", (short) 1998, 5, 3);
        ensureBook(institution, "African Economic History", "Ralph A. Austen", "Economics",
                "Subject: Economics. Long-run patterns of African trade, labour, and economic change.",
                "9780435080174", (short) 1987, 4, 2);

        ensureBook(institution, "Things Fall Apart", "Chinua Achebe", "Literature",
                "Subject: Literature. Achebe's classic Igbo novel on tradition, masculinity, and colonial encounter.",
                "9780385474542", (short) 1958, 8, 5);
        ensureBook(institution, "Purple Hibiscus", "Chimamanda Ngozi Adichie", "Literature",
                "Subject: Literature. Coming-of-age novel set in Nigeria exploring family, faith, and freedom.",
                "9780007189885", (short) 2003, 6, 4);
        ensureBook(institution, "Nervous Conditions", "Tsitsi Dangarembga", "Literature",
                "Subject: Literature. Zimbabwean novel on education, gender, and colonial identity.",
                "9780954702335", (short) 1988, 5, 3);
    }

    private void ensureBook(Institution institution, String title, String authorName, String subject,
                            String description, String isbn, short year,
                            int totalCopies, int availableCopies) {
        if (bookRepository.findFirstByTitleIgnoreCase(title).isPresent()) {
            return;
        }
        // Skip if ISBN already taken by another title
        if (isbn != null && !bookRepository.findByIsbn(isbn).isEmpty()) {
            return;
        }

        Author author = authorRepository.findByFullNameIgnoreCase(authorName)
                .orElseGet(() -> authorRepository.save(new Author(authorName, subject + " author")));

        Book book = new Book();
        book.setInstitution(institution);
        book.setTitle(title);
        book.setDescription(description);
        book.setIsbn(isbn);
        book.setPublicationYear(year);
        book.setLanguage("English");
        book.setTotalCopies(totalCopies);
        book.setAvailableCopies(availableCopies);
        book.setActive(true);
        book.setSubtitle("Subject: " + subject);
        Set<Author> authors = new HashSet<>();
        authors.add(author);
        book.setAuthors(authors);
        bookRepository.save(book);
    }

    private void tagExistingLiteratureBooks() {
        bookRepository.findAll().forEach(book -> {
            String title = book.getTitle() != null ? book.getTitle().toLowerCase() : "";
            String subtitle = book.getSubtitle() != null ? book.getSubtitle() : "";
            if (subtitle.toLowerCase().contains("subject:")) {
                return;
            }
            if (title.contains("things fall apart") || title.contains("purple hibiscus") || title.contains("nervous conditions")) {
                book.setSubtitle("Subject: Literature");
                if (book.getDescription() == null || book.getDescription().isBlank()) {
                    book.setDescription("Subject: Literature. Catalogued for LibraLink campus reading.");
                }
                bookRepository.save(book);
            }
        });
    }

    private Institution seedInstitution() {
        return institutionRepository.findAll().stream()
                .filter(i -> "KNUST".equalsIgnoreCase(i.getShortName())
                        || (i.getName() != null && i.getName().toLowerCase().contains("kwame nkrumah")))
                .findFirst()
                .orElseGet(() -> institutionRepository.save(new Institution(
                        "Kwame Nkrumah University of Science and Technology",
                        "KNUST",
                        "INSTITUTIONAL",
                        "Kumasi",
                        "library@knust.edu.gh",
                        "+233322060000"
                )));
    }

    private void seedLectureCourses(Institution institution) {
        if (institution == null) {
            return;
        }
        if (!courseRepository.findByInstitutionInstitutionId(institution.getInstitutionId()).isEmpty()) {
            return;
        }

        User admin = userRepository.findByEmailIgnoreCase("admin@libralink.com").orElse(null);
        Integer creatorId = admin != null ? admin.getId() : null;

        Course literature = new Course();
        literature.setInstitution(institution);
        literature.setName("African Literature");
        literature.setCode("ENGL 301");
        literature.setDescription("Lecture-to-Library sample course linking classroom texts to the catalogue.");
        literature.setStatus("ACTIVE");
        literature = courseRepository.save(literature);

        Course computing = new Course();
        computing.setInstitution(institution);
        computing.setName("Data Structures");
        computing.setCode("COE 252");
        computing.setDescription("Computing course with catalogue-linked reading list.");
        computing.setStatus("ACTIVE");
        computing = courseRepository.save(computing);

        List<Book> books = bookRepository.findAll();
        Book litBook = books.stream()
                .filter(b -> b.getTitle() != null && b.getTitle().toLowerCase().contains("things fall apart"))
                .findFirst()
                .orElse(books.isEmpty() ? null : books.get(0));
        Book compBook = books.stream()
                .filter(b -> b.getDescription() != null && b.getDescription().toLowerCase().contains("computing"))
                .findFirst()
                .orElse(books.size() > 1 ? books.get(1) : litBook);

        if (litBook != null) {
            literature.getBooks().add(litBook);
            courseRepository.save(literature);
        }
        if (compBook != null) {
            computing.getBooks().add(compBook);
            courseRepository.save(computing);
        }

        ReadingList litList = new ReadingList();
        litList.setCourseId(literature.getId());
        litList.setSchoolId(institution.getInstitutionId());
        litList.setCreatedBy(creatorId);
        litList.setTitle("ENGL 301 Required Reading — Semester 1");
        litList.setDescription("Official published reading list for African Literature.");
        litList.setSemester("Semester 1");
        litList.setAcademicYear("2025/2026");
        litList.setIsPublished(true);
        litList.setPublishedAt(LocalDateTime.now());
        litList = readingListRepository.save(litList);

        if (litBook != null) {
            ReadingListItem item = new ReadingListItem();
            item.setReadingListId(litList.getId());
            item.setSchoolId(institution.getInstitutionId());
            item.setBookId(litBook.getId());
            item.setNotes("REQUIRED");
            readingListItemRepository.save(item);
        }

        ReadingList compList = new ReadingList();
        compList.setCourseId(computing.getId());
        compList.setSchoolId(institution.getInstitutionId());
        compList.setCreatedBy(creatorId);
        compList.setTitle("COE 252 Recommended Texts");
        compList.setDescription("Recommended computing titles from the library catalogue.");
        compList.setSemester("Semester 1");
        compList.setAcademicYear("2025/2026");
        compList.setIsPublished(true);
        compList.setPublishedAt(LocalDateTime.now());
        compList = readingListRepository.save(compList);

        if (compBook != null) {
            ReadingListItem item = new ReadingListItem();
            item.setReadingListId(compList.getId());
            item.setSchoolId(institution.getInstitutionId());
            item.setBookId(compBook.getId());
            item.setNotes("RECOMMENDED");
            readingListItemRepository.save(item);
        }
    }

    private void seedAudioBookTracks(Institution institution) {
        if (!audioBookTrackRepository.findAll().isEmpty()) {
            return;
        }
        Book linked = bookRepository.findAll().stream()
                .filter(b -> b.getDescription() != null && b.getDescription().toLowerCase().contains("computing"))
                .findFirst()
                .orElse(bookRepository.findAll().stream().findFirst().orElse(null));

        AudioBookTrack track = new AudioBookTrack(
                "Data Structures: Linked Lists",
                "CS 301 - Dr. O. Asiedu",
                "COE 252",
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                1450,
                18.4
        );
        track.setSchoolId(institution.getInstitutionId());
        if (linked != null) {
            track.setBook(linked);
        }
        audioBookTrackRepository.save(track);
    }
}
