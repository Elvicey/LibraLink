package com.codequest.libralink.service;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.InviteCode;
import com.codequest.libralink.repository.InviteCodeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

/**
 * Shared issuance/validation for every invite/code flow (school_code, School Admin OTP,
 * librarian_code) - one set of hashing/expiry/used-once rules for all three, per InviteCode.
 *
 * Hashing: codeHash is a BCrypt hash of the raw code via the app's existing PasswordEncoder
 * bean (the real security boundary). codeLookupHash is a fast, unsalted SHA-256 digest used
 * only to narrow a DB lookup to a handful of rows before the BCrypt comparison runs - it is
 * not itself the security boundary.
 */
@Service
public class InviteCodeService {

    public static final String TYPE_SCHOOL_CODE = "SCHOOL_CODE";
    public static final String TYPE_SCHOOL_ADMIN_OTP = "SCHOOL_ADMIN_OTP";
    public static final String TYPE_LIBRARIAN_CODE = "LIBRARIAN_CODE";

    private final InviteCodeRepository inviteCodeRepository;
    private final PasswordEncoder passwordEncoder;

    public InviteCodeService(InviteCodeRepository inviteCodeRepository, PasswordEncoder passwordEncoder) {
        this.inviteCodeRepository = inviteCodeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public InviteCode issue(Institution school, String codeType, String targetRole, String email,
                             Integer issuedByUserId, LocalDateTime expiresAt, String rawCode) {
        InviteCode code = new InviteCode();
        code.setSchool(school);
        code.setCodeType(codeType);
        code.setTargetRole(targetRole);
        code.setEmail(email);
        code.setIssuedByUserId(issuedByUserId);
        code.setExpiresAt(expiresAt);
        code.setCodeHash(passwordEncoder.encode(rawCode));
        code.setCodeLookupHash(sha256Hex(rawCode));
        return inviteCodeRepository.save(code);
    }

    /**
     * Invalidates (marks used, with no consuming user) the most recent unused code of the
     * given type for a school - used when regenerating a school_code/librarian_code so the
     * old one can no longer be redeemed.
     */
    public void invalidateActive(Integer schoolId, String codeType) {
        inviteCodeRepository
                .findFirstBySchool_InstitutionIdAndCodeTypeAndUsedAtIsNullOrderByCreatedAtDesc(schoolId, codeType)
                .ifPresent(existing -> {
                    existing.setUsedAt(LocalDateTime.now());
                    inviteCodeRepository.save(existing);
                });
    }

    /**
     * Validates a raw code against unexpired, unused rows of the given type (optionally
     * scoped to a specific email and/or school), returning the matched row WITHOUT marking
     * it used yet - split from {@link #consume} so callers can create the account the code
     * grants access to first, and only mark the code spent once that succeeds (same
     * transaction, so any failure rolls back both together; a rejected signup never burns
     * the invite). Throws IllegalArgumentException("...not found...") on any failure -
     * deliberately generic (doesn't distinguish wrong-code from expired from already-used)
     * to avoid helping an attacker enumerate valid-but-expired codes, and lands in
     * GlobalExceptionHandler's existing "not found" -> 404 branch.
     */
    public InviteCode findValid(String rawCode, String codeType, String requiredEmail, Integer schoolId) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new IllegalArgumentException("Code not found or already used.");
        }
        List<InviteCode> candidates = inviteCodeRepository.findByCodeLookupHash(sha256Hex(rawCode));
        return candidates.stream()
                .filter(c -> codeType.equals(c.getCodeType()))
                .filter(InviteCode::isValid)
                .filter(c -> requiredEmail == null || requiredEmail.equalsIgnoreCase(c.getEmail()))
                .filter(c -> schoolId == null || (c.getSchool() != null && schoolId.equals(c.getSchool().getInstitutionId())))
                .filter(c -> passwordEncoder.matches(rawCode, c.getCodeHash()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Code not found or already used."));
    }

    @Transactional
    public void consume(InviteCode code, Integer usedByUserId) {
        code.setUsedAt(LocalDateTime.now());
        code.setUsedByUserId(usedByUserId);
        inviteCodeRepository.save(code);
    }

    private String sha256Hex(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
