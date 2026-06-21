package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // Spring Data JPA automatically provides all standard CRUD operations here
}