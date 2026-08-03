package com.codequest.libralink.service;

import com.codequest.libralink.entity.EmailVerificationCode;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.EmailVerificationCodeRepository;
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

/**
 * Gates student self-registration (POST /api/auth/register) on proving ownership of the
 * email address before the account can log in. Mirrors {@link PasswordResetService}'s
 * one-time, hashed, expiring, single-use code pattern, but - unlike password reset, which
 * must stay silent/non-committal to avoid leaking whether an account exists - a send
 * failure here is a real problem worth surfacing: the caller just created this account and
 * has no way to ever verify it if the code never arrives.
 */
@Service
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final BrevoEmailClient brevoEmailClient;
    private final int expiryMinutes;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationCodeRepository codeRepository,
            PasswordEncoder passwordEncoder,
            BrevoEmailClient brevoEmailClient,
            @Value("${email.verification.expiry-minutes:15}") int expiryMinutes) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.brevoEmailClient = brevoEmailClient;
        this.expiryMinutes = expiryMinutes;
    }

    /** Generates, stores, and emails a fresh code - invalidating any still-outstanding one. */
    @Transactional
    public void sendCode(String email) {
        String normalizedEmail = normalizeEmail(email);
        invalidateExistingCodes(normalizedEmail);

        String code = generateSixDigitCode();
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(normalizedEmail);
        verificationCode.setCodeHash(passwordEncoder.encode(code));
        verificationCode.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        verificationCode.setUsed(false);
        verificationCode.setCreatedAt(Instant.now());
        codeRepository.save(verificationCode);

        if (!brevoEmailClient.isConfigured()) {
            // Dev fallback, matching EmailService's unconfigured-SMTP path: log instead of
            // failing registration outright when no BREVO_API_KEY is set locally.
            org.slf4j.LoggerFactory.getLogger(EmailVerificationService.class)
                    .info("[DEV] Email verification code for {}: {}", normalizedEmail, code);
            return;
        }

        brevoEmailClient.sendEmail(
                normalizedEmail,
                "Verify your LibraLink email",
                "<p>Your LibraLink email verification code is: <strong>" + code + "</strong></p>"
                        + "<p>This code expires in " + expiryMinutes + " minutes.</p>");
    }

    /** Confirms the code and flips the account to verified. Returns the now-verified user. */
    @Transactional
    public User confirmCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        EmailVerificationCode verificationCode = findValidCode(normalizedEmail, code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

        user.setEmailVerified(true);
        userRepository.save(user);

        verificationCode.setUsed(true);
        codeRepository.save(verificationCode);
        invalidateExistingCodes(normalizedEmail);

        return user;
    }

    private Optional<EmailVerificationCode> findValidCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        String trimmedCode = code != null ? code.trim() : "";
        if (normalizedEmail.isEmpty() || !trimmedCode.matches("\\d{6}")) {
            return Optional.empty();
        }

        return codeRepository
                .findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(normalizedEmail, Instant.now())
                .filter(vc -> passwordEncoder.matches(trimmedCode, vc.getCodeHash()));
    }

    private void invalidateExistingCodes(String email) {
        List<EmailVerificationCode> existing = codeRepository.findByEmailAndUsedFalse(email);
        for (EmailVerificationCode existingCode : existing) {
            existingCode.setUsed(true);
            codeRepository.save(existingCode);
        }
    }

    private String generateSixDigitCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
