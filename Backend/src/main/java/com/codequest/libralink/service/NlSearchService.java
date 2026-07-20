package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class NlSearchService {

    private final BookRepository bookRepository;

    public NlSearchService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> naturalLanguageSearch(String query) {
        if (query == null || query.isBlank()) {
            return bookRepository.findAll();
        }

        String trimmed = query.trim();

        String authorHint = extractAfterPatterns(trimmed,
                Arrays.asList("by author", "written by", "author", "by"));
        if (authorHint != null && !authorHint.isBlank()) {
            List<Book> results = bookRepository.searchByAuthor(authorHint);
            if (!results.isEmpty()) return results;
        }

        String subjectHint = extractAfterPatterns(trimmed,
                Arrays.asList("subject", "category", "topic", "about"));
        if (subjectHint != null && !subjectHint.isBlank()) {
            List<Book> bySubject = bookRepository.findByTitleContainingIgnoreCase(subjectHint);
            if (!bySubject.isEmpty()) return bySubject;
        }

        boolean availabilityFilter = trimmed.toLowerCase().contains("available")
                || trimmed.toLowerCase().contains("in stock");

        String cleanedQuery = trimmed
                .replaceAll("(?i)(find|search|look for|show me|books? about|books? by|I need|I want)", "")
                .replaceAll("(?i)(available|in stock|on shelf)", "")
                .trim();

        List<Book> results;
        if (availabilityFilter) {
            results = bookRepository.searchAvailableByQuery(cleanedQuery);
        } else {
            results = bookRepository.searchByQuery(cleanedQuery);
        }

        if (results.isEmpty()) {
            String[] words = cleanedQuery.split("\\s+");
            if (words.length > 1) {
                Set<Book> combined = new LinkedHashSet<>();
                for (String word : words) {
                    if (word.length() > 2) {
                        combined.addAll(bookRepository.searchByQuery(word));
                    }
                }
                results = new ArrayList<>(combined);
            }
        }

        return results;
    }

    private String extractAfterPatterns(String text, List<String> patterns) {
        String lower = text.toLowerCase();
        for (String pattern : patterns) {
            int idx = lower.indexOf(pattern.toLowerCase());
            if (idx >= 0) {
                String after = text.substring(idx + pattern.length()).trim();
                if (!after.isBlank()) {
                    return after.split("\\s+(and|or|where|with|that|the)")[0].trim();
                }
            }
        }
        return null;
    }
}
