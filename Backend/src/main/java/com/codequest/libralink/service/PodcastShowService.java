package com.codequest.libralink.service;

import com.codequest.libralink.entity.PodcastShow;
import com.codequest.libralink.repository.PodcastEpisodeRepository;
import com.codequest.libralink.repository.PodcastShowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PodcastShowService {

    private final PodcastShowRepository podcastShowRepository;
    private final PodcastEpisodeRepository podcastEpisodeRepository;

    public PodcastShowService(PodcastShowRepository podcastShowRepository,
                              PodcastEpisodeRepository podcastEpisodeRepository) {
        this.podcastShowRepository = podcastShowRepository;
        this.podcastEpisodeRepository = podcastEpisodeRepository;
    }

    public List<PodcastShow> listPublishedShows() {
        return podcastShowRepository.findByIsPublishedTrueOrderByCreatedAtDesc();
    }

    public List<PodcastShow> listAllShows() {
        return podcastShowRepository.findAll();
    }

    public PodcastShow getShow(Integer id) {
        return podcastShowRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Podcast show not found with id: " + id));
    }

    @Transactional
    public PodcastShow createShow(PodcastShow show) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        show.setId(null);
        if (show.getTitle() == null || show.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (show.getCreatedAt() == null) {
            show.setCreatedAt(LocalDateTime.now());
        }
        if (show.getIsPublished() == null) {
            show.setIsPublished(true);
        }
        return podcastShowRepository.save(show);
    }

    @Transactional
    public PodcastShow updateShow(Integer id, PodcastShow updates) {
        PodcastShow existing = getShow(id);
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            existing.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            existing.setDescription(updates.getDescription());
        }
        if (updates.getCoverImageUrl() != null) {
            existing.setCoverImageUrl(updates.getCoverImageUrl());
        }
        if (updates.getHostName() != null) {
            existing.setHostName(updates.getHostName());
        }
        if (updates.getIsPublished() != null) {
            existing.setIsPublished(updates.getIsPublished());
        }
        existing.setUpdatedAt(LocalDateTime.now());
        return podcastShowRepository.save(existing);
    }

    @Transactional
    public void deleteShow(Integer id) {
        PodcastShow show = getShow(id);
        podcastEpisodeRepository.deleteByShowId(id);
        podcastShowRepository.delete(show);
    }
}
