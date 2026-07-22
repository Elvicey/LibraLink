package com.codequest.libralink.repository;

import com.codequest.libralink.entity.PodcastEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastEpisodeRepository extends JpaRepository<PodcastEpisode, Integer> {
    List<PodcastEpisode> findByShowIdOrderByEpisodeNumberAsc(Integer showId);
    List<PodcastEpisode> findByShowIdAndIsPublishedTrueOrderByEpisodeNumberAsc(Integer showId);
    List<PodcastEpisode> findByBookIdAndIsPublishedTrueOrderByPublishedAtDesc(Integer bookId);
}
