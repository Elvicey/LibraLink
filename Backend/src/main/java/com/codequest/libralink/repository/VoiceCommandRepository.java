package com.codequest.libralink.repository;

import com.codequest.libralink.entity.VoiceCommand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceCommandRepository extends JpaRepository<VoiceCommand, Integer> {
    List<VoiceCommand> findByUserId(Integer userId);
    List<VoiceCommand> findByDetectedIntent(String intent);
}
