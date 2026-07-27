package com.codequest.libralink.exception;

/**
 * Thrown when a requested resource doesn't exist. Several services previously threw a
 * plain {@link RuntimeException} for this case, which GlobalExceptionHandler has no
 * handler for, so it fell through to Spring Boot's default error page as an unhandled
 * 500 instead of a 404 (Medium finding: fragile/incomplete global error handling).
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
