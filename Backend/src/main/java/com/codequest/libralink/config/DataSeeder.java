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
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

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
        show.setDescription("Conversations about African literature, campus reading culture, and books in the LibraLink collection.");
        show.setHostName("LibraLink Library");
        show.setCoverImageUrl("https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800");
        show.setIsPublished(true);
        show = podcastShowRepository.save(show);

        PodcastEpisode ep1 = new PodcastEpisode();
        ep1.setShowId(show.getId());
        ep1.setTitle("Why Things Fall Apart Still Matters");
        ep1.setDescription("A short discussion of Chinua Achebe's classic and why it remains essential campus reading.");
        ep1.setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
        ep1.setDurationSeconds(372);
        ep1.setEpisodeNumber(1);
        ep1.setBookId(3);
        ep1.setIsPublished(true);
        podcastEpisodeRepository.save(ep1);

        PodcastEpisode ep2 = new PodcastEpisode();
        ep2.setShowId(show.getId());
        ep2.setTitle("Building a Reading Habit on Campus");
        ep2.setDescription("Tips for students balancing coursework and recreational reading with LibraLink.");
        ep2.setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3");
        ep2.setDurationSeconds(420);
        ep2.setEpisodeNumber(2);
        ep2.setIsPublished(true);
        podcastEpisodeRepository.save(ep2);
    }
}
