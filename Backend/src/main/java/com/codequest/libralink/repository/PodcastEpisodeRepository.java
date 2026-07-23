package com.codequest.libralink.repository;

import com.codequest.libralink.entity.PodcastEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastEpisodeRepository extends JpaRepository<PodcastEpisode, Integer> {
    List<PodcastEpisode> findByShowIdOrderByEpisodeNumberAsc(Integer showId);
    List<PodcastEpisode> findByShowIdAndIsPublishedTrueOrderByEpisodeNumberAsc(Integer showId);
    List<PodcastEpisode> findByBookIdAndIsPublishedTrueOrderByPublishedAtDesc(Integer bookId);

    // Medium (N+1): PodcastShowService.deleteShow used to fetch every episode for the
    // show and delete() each one individually (N delete statements). One bulk DELETE.
    @Modifying
    @Query("DELETE FROM PodcastEpisode e WHERE e.showId = :showId")
    void deleteByShowId(@Param("showId") Integer showId);
}
