package com.codequest.libralink.controller;

import com.codequest.libralink.entity.SearchLog;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @PostMapping
    public String testAnalytics() {
        return "Analytics endpoint working!";
    }

    private final AnalyticsService analyticsService;
    private final CurrentUserProvider currentUserProvider;

    // Bug fixed: explicitly defined constructor to replace @RequiredArgsConstructor
    public AnalyticsController(AnalyticsService analyticsService, CurrentUserProvider currentUserProvider) {
        this.analyticsService = analyticsService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/search-logs")
    public ResponseEntity<SearchLog> logSearch(@RequestBody SearchLog log) {
        // A search log always records who actually searched, never a client-supplied userId.
        log.setUserId(currentUserProvider.getCurrentUserId());
        return new ResponseEntity<>(analyticsService.logSearch(log), HttpStatus.CREATED);
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/search-logs/user/{userId}")
    public ResponseEntity<List<SearchLog>> getLogsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(analyticsService.getLogsByUser(userId));
    }

    // Cross-user aggregate views are a staff-only analytics concern.
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping("/search-logs/type/{searchType}")
    public ResponseEntity<List<SearchLog>> getLogsBySearchType(@PathVariable String searchType) {
        return ResponseEntity.ok(analyticsService.getLogsBySearchType(searchType));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping("/search-logs/date-range")
    public ResponseEntity<List<SearchLog>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(analyticsService.getLogsByDateRange(from, to));
    }
}
