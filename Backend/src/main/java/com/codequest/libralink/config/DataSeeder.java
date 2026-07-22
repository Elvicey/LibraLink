package com.codequest.libralink.config;

import com.codequest.libralink.entity.PodcastEpisode;
import com.codequest.libralink.entity.PodcastShow;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.PodcastEpisodeRepository;
import com.codequest.libralink.repository.PodcastShowRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder,
                      PodcastShowRepository podcastShowRepository,
                      PodcastEpisodeRepository podcastEpisodeRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.podcastShowRepository = podcastShowRepository;
        this.podcastEpisodeRepository = podcastEpisodeRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedPodcasts();
        upgradePlaceholderPodcastAudio();
    }

    private void seedAdmin() {
        String adminEmail = "admin@libralink.com";
        String adminPassword = "admin123";

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN")));

        User admin = userRepository.findByEmail(adminEmail).orElse(null);

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

    /**
     * Existing deploys seeded SoundHelix demo music. Replace those with book-linked spoken scripts.
     */
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
            if (show.getDescription() != null && show.getDescription().toLowerCase().contains("demo")) {
                return;
            }
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
