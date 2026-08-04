package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Integer> {

    List<Bookmark> findByUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Bookmark> findByUserIdAndBookId(Integer userId, Integer bookId);

    boolean existsByUserIdAndBookId(Integer userId, Integer bookId);

    void deleteByUserIdAndBookId(Integer userId, Integer bookId);
}
