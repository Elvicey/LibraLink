package com.codequest.libralink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String name; // e.g., STUDENT, LIBRARIAN, ADMIN

    public Role() {}

    public Role(String name) {
        this.name = name;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}