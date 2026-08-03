package com.codequest.libralink.dto;

// Returned by student self-registration instead of AuthResponse: no token is issued until
// the emailed code is confirmed via /api/auth/verify-email, which is what actually returns
// an AuthResponse and establishes the session.
public class EmailVerificationPendingResponse {

    private String email;
    private String message;

    public EmailVerificationPendingResponse(String email, String message) {
        this.email = email;
        this.message = message;
    }

    public String getEmail() { return email; }
    public String getMessage() { return message; }
}
