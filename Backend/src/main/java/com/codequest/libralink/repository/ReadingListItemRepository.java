package com.codequest.libralink.repository;

import com.codequest.libralink.entity.ReadingListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingListItemRepository extends JpaRepository<ReadingListItem, Integer> {
    List<ReadingListItem> findByReadingListId(Integer readingListId);
    List<ReadingListItem> findByBookId(Integer bookId);
}