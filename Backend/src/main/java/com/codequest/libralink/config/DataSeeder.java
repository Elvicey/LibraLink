package com.codequest.libralink.config;

import com.codequest.libralink.entity.Author;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.entity.PodcastEpisode;
import com.codequest.libralink.entity.PodcastShow;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.AuthorRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BorrowRecordRepository;
import com.codequest.libralink.repository.PodcastEpisodeRepository;
import com.codequest.libralink.repository.PodcastShowRepository;
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

    private static final String TFA_EPISODE_1_SCRIPT =
            "Welcome to LibraLink Literary Voices. Today's episode is about Chinua Achebe's novel Things Fall Apart, "
                    + "a cornerstone of African literature and a frequent campus reading-list title. "
                    + "Achebe follows Okonkwo, a driven Igbo leader whose personal ambition collides with the arrival of "
                    + "colonial authority and Christian missions in his community. "
                    + "The novel matters because it refuses the idea that African societies were silent before Europe arrived. "
                    + "Instead, Achebe shows a complex world of custom, status, family duty, and debate. "
                    + "As students, listen for how fear of weakness shapes Okonkwo's choices, and how the community itself "
                    + "is changed when outsiders redefine power and belief. "
                    + "If Things Fall Apart is on your course list, borrow it through LibraLink and read with those questions in mind. "
                    + "This has been Literary Voices. Thanks for listening.";

    private static final String TFA_EPISODE_2_SCRIPT =
            "Welcome back to LibraLink Literary Voices. We continue with Things Fall Apart by Chinua Achebe, "
                    + "focusing on Ikemefuna and what the story teaches about belonging. "
                    + "Ikemefuna arrives in Umuofia as a settlement for a dispute, grows close to Okonkwo's household, "
                    + "and then becomes the tragic centre of a decision that reveals the cost of rigid honour. "
                    + "Achebe asks whether tradition that cannot bend will break the people who live inside it. "
                    + "For campus readers, this episode is a reminder that the novel is not only about colonial encounter; "
                    + "it is also about how a community treats its own children, and how silence can become violence. "
                    + "Open Things Fall Apart in LibraLink, revisit the Ikemefuna chapters, and notice whose voice Achebe "
                    + "gives space to at each turn. Thanks for listening to Literary Voices.";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PodcastShowRepository podcastShowRepository;
    private final PodcastEpisodeRepository podcastEpisodeRepository;
    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final BorrowRecordRepository borrowRecordRepository;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder,
                      PodcastShowRepository podcastShowRepository,
                      PodcastEpisodeRepository podcastEpisodeRepository,
                      BookRepository bookRepository,
                      AuthorRepository authorRepository,
                      BorrowRecordRepository borrowRecordRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.podcastShowRepository = podcastShowRepository;
        this.podcastEpisodeRepository = podcastEpisodeRepository;
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.borrowRecordRepository = borrowRecordRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedDemoStudent();
        seedCatalogBooks();
        tagExistingLiteratureBooks();
        seedDemoBorrows();
        seedPodcasts();
        upgradePlaceholderPodcastAudio();
    }

    private void seedAdmin() {
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
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);
            userRepository.save(admin);
        } else {
            if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                Set<Role> roles = admin.getRoles();
                if (roles == null) roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                admin.setActive(true);
                userRepository.save(admin);
            }
        }
    }

    private void seedDemoStudent() {
        String email = "student@libralink.com";
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
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
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);
        student.setRoles(roles);
        userRepository.save(student);
    }

    private void seedDemoBorrows() {
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
            active.setStatus("BORROWED");
            active.setBorrowedAt(LocalDateTime.now().minusDays(3));
            active.setDueDate(LocalDate.now().plusDays(11));
            borrowRecordRepository.save(active);
        }
        if (tfa != null) {
            BorrowRecord returned = new BorrowRecord();
            returned.setUser(student);
            returned.setBook(tfa);
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
            overdue.setStatus("OVERDUE");
            overdue.setBorrowedAt(LocalDateTime.now().minusDays(20));
            overdue.setDueDate(LocalDate.now().minusDays(6));
            borrowRecordRepository.save(overdue);
        }
    }

    private void seedCatalogBooks() {
        ensureBook("Introduction to Calculus", "James Stewart", "Science",
                "Subject: Science. Core calculus text covering limits, derivatives, and integrals for undergraduate science students.",
                "9781285741550", (short) 2015, 8, 5);
        ensureBook("University Physics", "Hugh D. Young", "Science",
                "Subject: Science. Mechanics, waves, thermodynamics, and electromagnetism for first-year physics.",
                "9780321973610", (short) 2019, 6, 4);
        ensureBook("Organic Chemistry Essentials", "Paula Bruice", "Science",
                "Subject: Science. Foundations of organic chemistry with campus lab applications.",
                "9780134042282", (short) 2016, 5, 3);

        ensureBook("Data Structures in Practice", "Michael T. Goodrich", "Computing",
                "Subject: Computing. Arrays, trees, graphs, hashing, and algorithm analysis for CS courses.",
                "9781118771334", (short) 2014, 10, 7);
        ensureBook("Introduction to Algorithms", "Thomas H. Cormen", "Computing",
                "Subject: Computing. Classic algorithms reference used across computing departments.",
                "9780262046305", (short) 2022, 7, 4);
        ensureBook("Database System Concepts", "Abraham Silberschatz", "Computing",
                "Subject: Computing. Relational models, SQL, transactions, and modern database design.",
                "9780078022159", (short) 2019, 6, 4);

        ensureBook("Principles of Economics", "N. Gregory Mankiw", "Economics",
                "Subject: Economics. Micro and macro foundations for introductory economics modules.",
                "9780357133491", (short) 2020, 9, 6);
        ensureBook("Development Economics", "Debraj Ray", "Economics",
                "Subject: Economics. Growth, poverty, inequality, and development policy for African campuses.",
                "9780691017068", (short) 1998, 5, 3);
        ensureBook("African Economic History", "Ralph A. Austen", "Economics",
                "Subject: Economics. Long-run patterns of African trade, labour, and economic change.",
                "9780435080174", (short) 1987, 4, 2);

        ensureBook("Things Fall Apart", "Chinua Achebe", "Literature",
                "Subject: Literature. Achebe's classic Igbo novel on tradition, masculinity, and colonial encounter.",
                "9780385474542", (short) 1958, 8, 5);
        ensureBook("Purple Hibiscus", "Chimamanda Ngozi Adichie", "Literature",
                "Subject: Literature. Coming-of-age novel set in Nigeria exploring family, faith, and freedom.",
                "9780007189885", (short) 2003, 6, 4);
        ensureBook("Nervous Conditions", "Tsitsi Dangarembga", "Literature",
                "Subject: Literature. Zimbabwean novel on education, gender, and colonial identity.",
                "9780954702335", (short) 1988, 5, 3);
    }

    private void ensureBook(String title, String authorName, String subject,
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

    private void seedPodcasts() {
        if (podcastShowRepository.count() > 0) {
            return;
        }

        PodcastShow show = new PodcastShow();
        show.setTitle("LibraLink Literary Voices");
        show.setDescription("Spoken episodes about books in the LibraLink collection — start with Chinua Achebe's Things Fall Apart.");
        show.setHostName("LibraLink Library");
        show.setCoverImageUrl("https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800");
        show.setIsPublished(true);
        show = podcastShowRepository.save(show);

        podcastEpisodeRepository.save(buildThingsFallApartEpisode(show.getId(), 1,
                "Why Things Fall Apart Still Matters", TFA_EPISODE_1_SCRIPT, 95));
        podcastEpisodeRepository.save(buildThingsFallApartEpisode(show.getId(), 2,
                "Ikemefuna and the Cost of Belonging", TFA_EPISODE_2_SCRIPT, 90));
    }

    private void upgradePlaceholderPodcastAudio() {
        List<PodcastEpisode> episodes = podcastEpisodeRepository.findAll();
        for (PodcastEpisode episode : episodes) {
            String url = episode.getAudioUrl();
            boolean placeholder = url != null && url.toLowerCase().contains("soundhelix");
            boolean missingBookScript = episode.getBookId() == null
                    || episode.getDescription() == null
                    || episode.getDescription().length() < 200;
            if (!placeholder && !missingBookScript) {
                continue;
            }

            if (episode.getEpisodeNumber() != null && episode.getEpisodeNumber() == 2
                    && (episode.getTitle() == null || episode.getTitle().toLowerCase().contains("reading habit"))) {
                episode.setTitle("Ikemefuna and the Cost of Belonging");
                episode.setDescription(TFA_EPISODE_2_SCRIPT);
                episode.setDurationSeconds(90);
            } else {
                episode.setTitle(episode.getTitle() != null && episode.getTitle().toLowerCase().contains("things fall apart")
                        ? episode.getTitle()
                        : "Why Things Fall Apart Still Matters");
                episode.setDescription(TFA_EPISODE_1_SCRIPT);
                episode.setDurationSeconds(95);
            }
            episode.setBookId(3);
            episode.setAudioUrl(null);
            episode.setIsPublished(true);
            podcastEpisodeRepository.save(episode);
        }

        podcastShowRepository.findAll().forEach(show -> {
            if ("Integration Test Show".equals(show.getTitle())) {
                show.setTitle("Things Fall Apart Companion");
                show.setDescription("Short spoken companion episodes for Chinua Achebe's Things Fall Apart in the LibraLink catalog.");
                show.setHostName("LibraLink Library");
                podcastShowRepository.save(show);
            }
        });
    }

    private PodcastEpisode buildThingsFallApartEpisode(Integer showId, int number, String title,
                                                       String script, int durationSeconds) {
        PodcastEpisode episode = new PodcastEpisode();
        episode.setShowId(showId);
        episode.setTitle(title);
        episode.setDescription(script);
        episode.setAudioUrl(null);
        episode.setDurationSeconds(durationSeconds);
        episode.setEpisodeNumber(number);
        episode.setBookId(3);
        episode.setIsPublished(true);
        return episode;
    }
}
