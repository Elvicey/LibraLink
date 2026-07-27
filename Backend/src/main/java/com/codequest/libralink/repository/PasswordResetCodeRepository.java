package com.codequest.libralink.repository;

import com.codequest.libralink.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    List<PasswordResetCode> findByEmailAndUsedFalse(String email);

    Optional<PasswordResetCode> findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, Instant now);
}
