package com.codequest.libralink.repository;

import com.codequest.libralink.entity.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    List<EmailVerificationCode> findByEmailAndUsedFalse(String email);

    Optional<EmailVerificationCode> findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, Instant now);
}
