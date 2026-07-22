package com.codequest.libralink.repository;

import com.codequest.libralink.entity.UserAudioProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserAudioProgressRepository extends JpaRepository<UserAudioProgress, Integer> {
    Optional<UserAudioProgress> findByUserIdAndTrackId(Integer userId, Integer trackId);
    List<UserAudioProgress> findByUserId(Integer userId);
}
