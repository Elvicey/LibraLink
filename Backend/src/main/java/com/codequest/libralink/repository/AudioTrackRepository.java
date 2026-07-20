package com.codequest.libralink.repository;

import com.codequest.libralink.entity.AudioTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudioTrackRepository extends JpaRepository<AudioTrack, Integer> {
    List<AudioTrack> findByUserId(Integer userId);
    List<AudioTrack> findByBookId(Integer bookId);
    List<AudioTrack> findByUserIdAndBookId(Integer userId, Integer bookId);
    List<AudioTrack> findByStatus(String status);
}
