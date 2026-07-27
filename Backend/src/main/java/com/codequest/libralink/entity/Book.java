package com.codequest.libralink.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "books", indexes = {
        @Index(name = "idx_book_title", columnList = "title"),
        @Index(name = "idx_book_isbn", columnList = "isbn"),
        @Index(name = "idx_book_isbn13", columnList = "isbn13"),
        @Index(name = "idx_book_category", columnList = "category_id")
})
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Many books beInteger to one Institution (= School). NOT NULL as of the
    // multi-tenant retrofit - every book belongs to exactly one school.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @Column(unique = true, length = 20)
    private String isbn;

    @Column(unique = true, length = 20)
    private String isbn13;

    @Column(name = "publisher_id")
    private Integer publisherId; // Can map to a Publisher entity later if needed

    @Column(name = "category_id")
    private Integer categoryId;   // Can map to a Category entity later if needed

    @Column(name = "publication_year")
    private Short publicationYear; // Maps to SMALLINT in SQL

    @Column(length = 50)
    private String edition;

    @Column(length = 50)
    private String language = "English";

    @Column(columnDefinition = "TEXT")
    private String description;

    // Full readable text of the book (added by a librarian/admin). Served only via
    // GET /api/books/{id}/content and used for the in-app reader + AI narration, so it's
    // kept out of the normal book JSON (list/detail) to keep those responses small.
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "digital_url", length = 500)
    private String digitalUrl;

    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies = 1;

    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies = 1;

    @Column(name = "location_code", length = 50)
    private String locationCode;

    @Column(name = "dewey_decimal", length = 50)
    private String deweyDecimal;

    @Column(name = "is_digital_only", nullable = false)
    private boolean isDigitalOnly = false;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_authors",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    @JsonIgnoreProperties("books")
    private Set<Author> authors = new HashSet<>();

    @Column(name = "borrow_count", nullable = false)
    private Integer borrowCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // =============================================================
    // 1. No-Argument Constructor (Required by Jackson & JPA)
    // =============================================================
    public Book() {
        // Keeps Spring from throwing "HttpMessageNotReadableException"
    }

    // =============================================================
    // 2. Parameterized Constructor (For testing convenience)
    // =============================================================
    public Book(String title, String subtitle, String isbn, String isbn13, Institution institution) {
        this.title = title;
        this.subtitle = subtitle;
        this.isbn = isbn;
        this.isbn13 = isbn13;
        this.institution = institution;
    }

    // =============================================================
    // 3. Getters and Setters
    // =============================================================
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Institution getInstitution() { return institution; }
    public void setInstitution(Institution institution) { this.institution = institution; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getIsbn13() { return isbn13; }
    public void setIsbn13(String isbn13) { this.isbn13 = isbn13; }

    public Integer getPublisherId() { return publisherId; }
    public void setPublisherId(Integer publisherId) { this.publisherId = publisherId; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Short getPublicationYear() { return publicationYear; }
    public void setPublicationYear(Short publicationYear) { this.publicationYear = publicationYear; }

    public String getEdition() { return edition; }
    public void setEdition(String edition) { this.edition = edition; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getDigitalUrl() { return digitalUrl; }
    public void setDigitalUrl(String digitalUrl) { this.digitalUrl = digitalUrl; }

    public Integer getTotalCopies() { return totalCopies; }
    public void setTotalCopies(Integer totalCopies) { this.totalCopies = totalCopies; }

    public Integer getAvailableCopies() { return availableCopies; }
    public void setAvailableCopies(Integer availableCopies) { this.availableCopies = availableCopies; }

    public String getLocationCode() { return locationCode; }
    public void setLocationCode(String locationCode) { this.locationCode = locationCode; }

    public String getDeweyDecimal() { return deweyDecimal; }
    public void setDeweyDecimal(String deweyDecimal) { this.deweyDecimal = deweyDecimal; }

    public boolean isDigitalOnly() { return isDigitalOnly; }
    public void setDigitalOnly(boolean digitalOnly) { isDigitalOnly = digitalOnly; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public Integer getBorrowCount() { return borrowCount; }
    public void setBorrowCount(Integer borrowCount) { this.borrowCount = borrowCount; }

    public Set<Author> getAuthors() { return authors; }
    public void setAuthors(Set<Author> authors) { this.authors = authors; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void setUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}