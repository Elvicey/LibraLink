package com.codequest.libralink.repository;

import com.codequest.libralink.entity.PodcastShow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastShowRepository extends JpaRepository<PodcastShow, Integer> {
    List<PodcastShow> findByIsPublishedTrueOrderByCreatedAtDesc();
    boolean existsByTitleIgnoreCase(String title);
}
