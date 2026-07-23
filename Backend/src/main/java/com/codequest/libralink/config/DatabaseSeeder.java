package com.codequest.libralink.config;

import com.codequest.libralink.entity.*;
import com.codequest.libralink.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final BookRepository bookRepository;
    private final ReadingListRepository readingListRepository;
    private final ReadingListItemRepository readingListItemRepository;

    public DatabaseSeeder(InstitutionRepository institutionRepository,
            UserRepository userRepository,
            CourseRepository courseRepository,
            BookRepository bookRepository,
            ReadingListRepository readingListRepository,
            ReadingListItemRepository readingListItemRepository) {
        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.bookRepository = bookRepository;
        this.readingListRepository = readingListRepository;
        this.readingListItemRepository = readingListItemRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (institutionRepository.count() == 0) {
            System.out.println("Seeding database default values...");

            // 1. Seed Institution
            Institution inst = new Institution();
            inst.setName("KNUST Main Campus");
            inst.setShortName("KNUST");
            inst.setTier("BASIC");
            inst.setCity("Kumasi");
            inst.setCountry("Ghana");
            inst.setEmail("info@knust.edu.gh");
            inst.setPhone("+233322060444");
            inst.setActive(true);
            inst = institutionRepository.save(inst);

            // 2. Seed User
            User user = new User();
            user.setInstitution(inst);
            user.setFirstName("Esther");
            user.setLastName("Asamoah");
            user.setEmail("esther@knust.edu.gh");
            user.setPasswordHash("password");
            user.setPhoneNumber("+233241234567");
            user.setActive(true);
            user = userRepository.save(user);

            // 3. Seed Courses
            Course c1 = new Course();
            c1.setInstitution(inst);
            c1.setName("Data Structures");
            c1.setCode("CS 301");
            c1.setDescription("Introduction to elementary data structures.");
            c1.setStatus("ACTIVE");
            c1 = courseRepository.save(c1);

            Course c2 = new Course();
            c2.setInstitution(inst);
            c2.setName("Algorithms");
            c2.setCode("CS 302");
            c2.setDescription("Design and analysis of computer algorithms.");
            c2.setStatus("ACTIVE");
            courseRepository.save(c2);

            Course c3 = new Course();
            c3.setInstitution(inst);
            c3.setName("Database Systems");
            c3.setCode("CS 401");
            c3.setDescription("Relational database concepts and indexing techniques.");
            c3.setStatus("ACTIVE");
            courseRepository.save(c3);

            // 4. Seed Books
            Book b1 = new Book();
            b1.setInstitution(inst);
            b1.setTitle("Things Fall Apart");
            b1.setSubtitle("Classic Novel");
            b1.setIsbn("9780385474542");
            b1.setIsbn13("978-0385474542");
            b1.setTotalCopies(5);
            b1.setAvailableCopies(5);
            b1.setDigitalOnly(false);
            b1.setActive(true);
            bookRepository.save(b1);

            Book b2 = new Book();
            b2.setInstitution(inst);
            b2.setTitle("Introduction to Calculus");
            b2.setSubtitle("Exam Prep Study Guide");
            b2.setIsbn("9780534393397");
            b2.setIsbn13("978-0534393397");
            b2.setTotalCopies(3);
            b2.setAvailableCopies(2);
            b2.setDigitalOnly(false);
            b2.setActive(true);
            bookRepository.save(b2);

            Book b3 = new Book();
            b3.setInstitution(inst);
            b3.setTitle("African Economics");
            b3.setSubtitle("Policy and Growth Analysis");
            b3.setIsbn("9780199687770");
            b3.setIsbn13("978-0199687770");
            b3.setTotalCopies(4);
            b3.setAvailableCopies(4);
            b3.setDigitalOnly(false);
            b3.setActive(true);
            bookRepository.save(b3);

            Book b4 = new Book();
            b4.setInstitution(inst);
            b4.setTitle("African Economic Dev.");
            b4.setSubtitle("Policy Perspectives");
            b4.setIsbn("9780198744894");
            b4.setIsbn13("978-0198744894");
            b4.setTotalCopies(2);
            b4.setAvailableCopies(1);
            b4.setDigitalOnly(false);
            b4.setActive(true);
            bookRepository.save(b4);

            Book b5 = new Book();
            b5.setInstitution(inst);
            b5.setTitle("Data Structures in Practice");
            b5.setSubtitle("Computing Handbook");
            b5.setIsbn("9780132847377");
            b5.setIsbn13("978-0132847377");
            b5.setTotalCopies(6);
            b5.setAvailableCopies(6);
            b5.setDigitalOnly(false);
            b5.setActive(true);
            b5 = bookRepository.save(b5);

            // 5. Seed Reading List
            ReadingList rl = new ReadingList();
            rl.setCourseId(c1.getId());
            rl.setCreatedBy(user.getId());
            rl.setTitle("CS 301 Semester Readings");
            rl.setDescription("Core textbook and guides for CS 301.");
            rl.setSemester("Semester 1");
            rl.setAcademicYear("2026/2027");
            rl.setIsPublished(true);
            rl.setPublishedAt(LocalDateTime.now());
            rl = readingListRepository.save(rl);

            // 6. Seed Reading List Item
            ReadingListItem rli = new ReadingListItem();
            rli.setReadingListId(rl.getId());
            rli.setBookId(b5.getId());
            rli.setNotes("Please read chapters 1 to 5.");
            rli.setRequiredBy(LocalDateTime.now().plusMonths(3));
            readingListItemRepository.save(rli);

            System.out.println("Seeding completed successfully!");
        } else {
            System.out.println("Database already contains data, skipping seeding.");
        }
    }
}
