package com.codequest.libralink.service;

import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.repository.ReadingListRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class ReadingListService {

    private final ReadingListRepository readingListRepository;

    // Explicit constructor added to handle dependency injection manually
    public ReadingListService(ReadingListRepository readingListRepository) {
        this.readingListRepository = readingListRepository;
    }

    public ReadingList saveReadingList(ReadingList list) {
        return readingListRepository.save(list);
    }

    public List<ReadingList> getReadingListsByCourse(Integer courseId) {
        return readingListRepository.findByCourseId(courseId);
    }
}