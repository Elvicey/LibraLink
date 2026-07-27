package com.codequest.libralink.repository;

import com.codequest.libralink.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Integer> {
    List<SearchLog> findByUserId(Integer userId);

    // Capped (H9): these back staff-only "browse all search logs" endpoints with no other
    // filter, so without a limit they'd return every matching row ever recorded as the
    // table grows. Ordered by recency so the cap still returns the most useful/current
    // rows; proper pagination is a follow-up.
    List<SearchLog> findTop1000BySearchTypeOrderByCreatedAtDesc(String searchType);
    List<SearchLog> findTop1000ByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
}