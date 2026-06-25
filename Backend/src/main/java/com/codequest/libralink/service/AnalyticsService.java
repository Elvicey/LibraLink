package com.codequest.libralink.service;

import com.codequest.libralink.entity.SearchLog;
import com.codequest.libralink.repository.SearchLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnalyticsService {

    private final SearchLogRepository searchLogRepository;

    // Bug fixed: explicitly defined constructor to replace @RequiredArgsConstructor
    public AnalyticsService(SearchLogRepository searchLogRepository) {
        this.searchLogRepository = searchLogRepository;
    }

    public SearchLog logSearch(SearchLog log) {
        log.setCreatedAt(LocalDateTime.now());
        return searchLogRepository.save(log);
    }

    public List<SearchLog> getLogsByUser(Integer userId) {
        return searchLogRepository.findByUserId(userId);
    }

    public List<SearchLog> getLogsBySearchType(String searchType) {
        return searchLogRepository.findBySearchType(searchType);
    }

    public List<SearchLog> getLogsByDateRange(LocalDateTime from, LocalDateTime to) {
        return searchLogRepository.findByCreatedAtBetween(from, to);
    }
}