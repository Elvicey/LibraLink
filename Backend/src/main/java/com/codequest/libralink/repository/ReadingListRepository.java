package com.codequest.libralink.repository;

import com.codequest.libralink.entity.ReadingList;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReadingListRepository extends JpaRepository<ReadingList, Integer> {
    List<ReadingList> findByCourseId(Integer courseId);
}