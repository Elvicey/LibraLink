package com.codequest.libralink.util;

import java.security.SecureRandom;

/**
 * Human-typeable invite/join code generation. No prior precedent in this codebase to reuse
 * (the only existing generated-code pattern, PickupSlotService's UUID-based QR code, is a
 * long opaque string, not something a person types in) - built new for school_code,
 * librarian_code, and OTP.
 */
public final class CodeGenerator {

    private CodeGenerator() {}

    // Excludes visually ambiguous characters (0/O, 1/I/L) to reduce transcription errors.
    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateSchoolCode() {
        return generateAlphanumeric(8);
    }

    public static String generateLibrarianCode() {
        return generateAlphanumeric(8);
    }

    /** 6-digit numeric OTP, zero-padded. */
    public static String generateOtp() {
        int value = RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    private static String generateAlphanumeric(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
