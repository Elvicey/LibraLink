package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_logs", indexes = {
        @Index(name = "idx_search_user_id", columnList = "user_id"),
        @Index(name = "idx_search_created_at", columnList = "created_at")
})
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "query", nullable = false, length = 255)
    private String query;

    @Column(name = "results_count")
    private Integer resultsCount;

    @Column(name = "search_type", length = 50)
    private String searchType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SearchLog() {}

    public SearchLog(Integer id, Integer userId, String query, Integer resultsCount,
                     String searchType, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.query = query;
        this.resultsCount = resultsCount;
        this.searchType = searchType;
        this.createdAt = createdAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public Integer getResultsCount() { return resultsCount; }
    public void setResultsCount(Integer resultsCount) { this.resultsCount = resultsCount; }

    public String getSearchType() { return searchType; }
    public void setSearchType(String searchType) { this.searchType = searchType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}