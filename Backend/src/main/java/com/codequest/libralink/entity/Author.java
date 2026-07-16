package com.codequest.libralink.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "authors")
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @ManyToMany(mappedBy = "authors", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("authors")
    private Set<Book> books = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Author() {}

    public Author(String fullName, String bio) {
        this.fullName = fullName;
        this.bio = bio;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Set<Book> getBooks() { return books; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}