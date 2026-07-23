package com.codequest.libralink.config;

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
