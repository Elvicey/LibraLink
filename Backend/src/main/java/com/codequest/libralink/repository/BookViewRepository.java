package com.codequest.libralink.repository;

import com.codequest.libralink.entity.BookView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookViewRepository extends JpaRepository<BookView, Integer> {
}