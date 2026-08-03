package com.codequest.libralink.config;

import com.codequest.libralink.exception.ResourceNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Thrown when a @Valid @RequestBody fails bean-validation constraints (H6). Without
    // this handler Spring's default fallback still returns 400, but with a much less
    // useful body; this surfaces exactly which field(s) were invalid and why.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(),
                    error.getDefaultMessage() != null ? error.getDefaultMessage() : "is invalid");
        }
        return ResponseEntity.badRequest().body(Map.of(
                "error", "Validation failed",
                "fields", fieldErrors
        ));
    }

    // Several services used to throw a plain RuntimeException for "not found" instead
    // of IllegalArgumentException, which this handler had no case for - those calls
    // silently became unhandled 500s. They've been converted to this typed exception.
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Resource not found."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Invalid request.";
        if (message.toLowerCase().contains("barcode") && message.toLowerCase().contains("already exists")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message));
        }
        if (message.toLowerCase().contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
        }
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    // Services throw IllegalStateException for two distinct situations, both of which
    // previously fell through to a generic 500: an external dependency being unconfigured
    // /unavailable (AI or payments key unset -> 503 Service Unavailable), and a business-rule
    // conflict with the current state (e.g. "loan can no longer be renewed", "already
    // returned" -> 409 Conflict). NOTE: this deliberately does NOT catch broader exceptions,
    // so Spring Security's AccessDeniedException still yields 403 rather than being masked.
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Request could not be completed.";
        String lower = message.toLowerCase();
        if (lower.contains("not configured") || lower.contains("not available")
                || lower.contains("unavailable")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", message));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        if (message != null && message.toLowerCase().contains("barcode")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A book copy with this barcode already exists."));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Database constraint violation.", "detail", message != null ? message : ""));
    }
}
