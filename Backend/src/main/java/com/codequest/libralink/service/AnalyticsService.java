package com.codequest.libralink.service;

import com.codequest.libralink.entity.SearchLog;
import com.codequest.libralink.repository.SearchLogRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnalyticsService {

    private final SearchLogRepository searchLogRepository;
    private final SchoolContext schoolContext;

    // Bug fixed: explicitly defined constructor to replace @RequiredArgsConstructor
    public AnalyticsService(SearchLogRepository searchLogRepository, SchoolContext schoolContext) {
        this.searchLogRepository = searchLogRepository;
        this.schoolContext = schoolContext;
    }

    public SearchLog logSearch(SearchLog log) {
        log.setSchoolId(schoolContext.requireSchoolId());
        log.setCreatedAt(LocalDateTime.now());
        return searchLogRepository.save(log);
    }

    public List<SearchLog> getLogsByUser(Integer userId) {
        return scoped(searchLogRepository.findByUserId(userId));
    }

    public List<SearchLog> getLogsBySearchType(String searchType) {
        return scoped(searchLogRepository.findBySearchType(searchType));
    }

    public List<SearchLog> getLogsByDateRange(LocalDateTime from, LocalDateTime to) {
        return scoped(searchLogRepository.findByCreatedAtBetween(from, to));
    }

    private List<SearchLog> scoped(List<SearchLog> logs) {
        if (schoolContext.isPlatformSuperAdmin()) {
            return logs;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return logs.stream().filter(l -> schoolId.equals(l.getSchoolId())).toList();
    }
}