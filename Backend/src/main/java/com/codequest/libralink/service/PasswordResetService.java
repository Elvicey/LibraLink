package com.codequest.libralink.service;

import com.codequest.libralink.entity.PasswordResetCode;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.PasswordResetCodeRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository resetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final int expiryMinutes;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetCodeRepository resetCodeRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${password.reset.expiry-minutes:15}") int expiryMinutes) {
        this.userRepository = userRepository;
        this.resetCodeRepository = resetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.expiryMinutes = expiryMinutes;
    }

    @Transactional
    public void requestReset(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isEmpty()) {
            return;
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            return;
        }

        invalidateExistingCodes(normalizedEmail);

        String code = generateSixDigitCode();
        PasswordResetCode resetCode = new PasswordResetCode();
        resetCode.setEmail(normalizedEmail);
        resetCode.setCodeHash(passwordEncoder.encode(code));
        resetCode.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        resetCode.setUsed(false);
        resetCode.setCreatedAt(Instant.now());
        resetCodeRepository.save(resetCode);

        emailService.sendPasswordResetCode(normalizedEmail, code);
    }

    public void verifyCode(String email, String code) {
        findValidCode(email, code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        PasswordResetCode resetCode = findValidCode(normalizedEmail, code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetCode.setUsed(true);
        resetCodeRepository.save(resetCode);
        invalidateExistingCodes(normalizedEmail);
    }

    private Optional<PasswordResetCode> findValidCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        String trimmedCode = code != null ? code.trim() : "";
        if (normalizedEmail.isEmpty() || !trimmedCode.matches("\\d{6}")) {
            return Optional.empty();
        }

        return resetCodeRepository
                .findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(normalizedEmail, Instant.now())
                .filter(resetCode -> passwordEncoder.matches(trimmedCode, resetCode.getCodeHash()));
    }

    private void invalidateExistingCodes(String email) {
        List<PasswordResetCode> existing = resetCodeRepository.findByEmailAndUsedFalse(email);
        for (PasswordResetCode existingCode : existing) {
            existingCode.setUsed(true);
            resetCodeRepository.save(existingCode);
        }
    }

    private String generateSixDigitCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
