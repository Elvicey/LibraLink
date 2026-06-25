package com.codequest.libralink.controller;

import com.codequest.libralink.entity.SearchLog;
import com.codequest.libralink.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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

    // Bug fixed: explicitly defined constructor to replace @RequiredArgsConstructor
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/search-logs")
    public ResponseEntity<SearchLog> logSearch(@RequestBody SearchLog log) {
        return ResponseEntity.ok(analyticsService.logSearch(log));
    }

    @GetMapping("/search-logs/user/{userId}")
    public ResponseEntity<List<SearchLog>> getLogsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(analyticsService.getLogsByUser(userId));
    }

    @GetMapping("/search-logs/type/{searchType}")
    public ResponseEntity<List<SearchLog>> getLogsBySearchType(@PathVariable String searchType) {
        return ResponseEntity.ok(analyticsService.getLogsBySearchType(searchType));
    }

    @GetMapping("/search-logs/date-range")
    public ResponseEntity<List<SearchLog>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(analyticsService.getLogsByDateRange(from, to));
    }
}