package com.codequest.libralink.service;

import com.codequest.libralink.entity.PodcastEpisode;
import com.codequest.libralink.repository.PodcastEpisodeRepository;
import com.codequest.libralink.repository.PodcastShowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PodcastEpisodeService {

    private final PodcastEpisodeRepository podcastEpisodeRepository;
    private final PodcastShowRepository podcastShowRepository;

    public PodcastEpisodeService(PodcastEpisodeRepository podcastEpisodeRepository,
                                 PodcastShowRepository podcastShowRepository) {
        this.podcastEpisodeRepository = podcastEpisodeRepository;
        this.podcastShowRepository = podcastShowRepository;
    }

    public List<PodcastEpisode> listPublishedEpisodesForShow(Integer showId) {
        ensureShowExists(showId);
        return podcastEpisodeRepository.findByShowIdAndIsPublishedTrueOrderByEpisodeNumberAsc(showId);
    }

    public List<PodcastEpisode> listEpisodesForShow(Integer showId) {
        ensureShowExists(showId);
        return podcastEpisodeRepository.findByShowIdOrderByEpisodeNumberAsc(showId);
    }

    public List<PodcastEpisode> listPublishedByBook(Integer bookId) {
        return podcastEpisodeRepository.findByBookIdAndIsPublishedTrueOrderByPublishedAtDesc(bookId);
    }

    public PodcastEpisode getEpisode(Integer id) {
        return podcastEpisodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Podcast episode not found with id: " + id));
    }

    @Transactional
    public PodcastEpisode createEpisode(Integer showId, PodcastEpisode episode) {
        ensureShowExists(showId);
        if (episode.getTitle() == null || episode.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        episode.setShowId(showId);
        if (episode.getCreatedAt() == null) {
            episode.setCreatedAt(LocalDateTime.now());
        }
        if (episode.getIsPublished() == null) {
            episode.setIsPublished(true);
        }
        if (Boolean.TRUE.equals(episode.getIsPublished()) && episode.getPublishedAt() == null) {
            episode.setPublishedAt(LocalDateTime.now());
        }
        return podcastEpisodeRepository.save(episode);
    }

    @Transactional
    public PodcastEpisode updateEpisode(Integer episodeId, PodcastEpisode updates) {
        PodcastEpisode existing = getEpisode(episodeId);
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            existing.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            existing.setDescription(updates.getDescription());
        }
        if (updates.getAudioUrl() != null) {
            existing.setAudioUrl(updates.getAudioUrl());
        }
        if (updates.getDurationSeconds() != null) {
            existing.setDurationSeconds(updates.getDurationSeconds());
        }
        if (updates.getEpisodeNumber() != null) {
            existing.setEpisodeNumber(updates.getEpisodeNumber());
        }
        if (updates.getBookId() != null) {
            existing.setBookId(updates.getBookId());
        }
        if (updates.getIsPublished() != null) {
            existing.setIsPublished(updates.getIsPublished());
            if (Boolean.TRUE.equals(updates.getIsPublished()) && existing.getPublishedAt() == null) {
                existing.setPublishedAt(LocalDateTime.now());
            }
        }
        existing.setUpdatedAt(LocalDateTime.now());
        return podcastEpisodeRepository.save(existing);
    }

    @Transactional
    public void deleteEpisode(Integer episodeId) {
        PodcastEpisode episode = getEpisode(episodeId);
        podcastEpisodeRepository.delete(episode);
    }

    private void ensureShowExists(Integer showId) {
        if (!podcastShowRepository.existsById(showId)) {
            throw new IllegalArgumentException("Podcast show not found with id: " + showId);
        }
    }
}
