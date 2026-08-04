package com.codequest.libralink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final BrevoEmailClient brevoEmailClient;

    public EmailService(BrevoEmailClient brevoEmailClient) {
        this.brevoEmailClient = brevoEmailClient;
    }

    public void sendPasswordResetCode(String toEmail, String code) {
        if (!brevoEmailClient.isConfigured()) {
            log.info("[DEV] Password reset code for {}: {}", toEmail, code);
            return;
        }

        try {
            brevoEmailClient.sendEmail(
                    toEmail,
                    "LibraLink password reset code",
                    "<p>Your LibraLink password reset code is: <strong>" + code + "</strong></p>"
                            + "<p>This code expires in 15 minutes. If you did not request a reset, ignore this email.</p>");
            log.info("Password reset code sent to {}", toEmail);
        } catch (Exception e) {
            // Never rethrow: the forgot-password endpoint must stay non-500 and
            // email-enumeration-safe (it returns the same generic response whether or not
            // the account exists). A misconfigured/failing Brevo call is a server-side
            // concern - log it so operators can fix it, but don't surface it to the caller.
            log.error("Failed to send password reset code to {}: {}", toEmail, e.getMessage());
        }
    }
}
