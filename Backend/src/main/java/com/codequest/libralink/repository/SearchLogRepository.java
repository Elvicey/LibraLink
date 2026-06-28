package com.codequest.libralink.repository;

import com.codequest.libralink.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Integer> {
    List<SearchLog> findByUserId(Integer userId);
    List<SearchLog> findBySearchType(String searchType);
    List<SearchLog> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}