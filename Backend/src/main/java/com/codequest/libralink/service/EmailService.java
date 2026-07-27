package com.codequest.libralink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final boolean mailConfigured;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.from:noreply@libralink.com}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.mailConfigured = mailHost != null && !mailHost.isBlank();
    }

    public void sendPasswordResetCode(String toEmail, String code) {
        if (!mailConfigured) {
            log.info("[DEV] Password reset code for {}: {}", toEmail, code);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("LibraLink password reset code");
            message.setText(
                    "Your LibraLink password reset code is: " + code + "\n\n"
                            + "This code expires in 15 minutes. If you did not request a reset, ignore this email.");
            mailSender.send(message);
            log.info("Password reset code sent to {}", toEmail);
        } catch (Exception e) {
            // Never rethrow: the forgot-password endpoint must stay non-500 and
            // email-enumeration-safe (it returns the same generic response whether or not
            // the account exists). A misconfigured/slow SMTP is a server-side concern —
            // log it so operators can fix it, but don't surface it to the caller.
            log.error("Failed to send password reset code to {}: {}", toEmail, e.getMessage());
        }
    }
}
