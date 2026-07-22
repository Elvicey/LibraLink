package com.codequest.libralink.repository;

import com.codequest.libralink.entity.AudioBookTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudioBookTrackRepository extends JpaRepository<AudioBookTrack, Integer> {
    List<AudioBookTrack> findByCourseCodeIgnoreCase(String courseCode);
    List<AudioBookTrack> findByAuthorContainingIgnoreCase(String author);
}
