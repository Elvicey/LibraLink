package com.codequest.libralink;

import com.codequest.libralink.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * The forgot-password endpoint must stay non-500 and email-enumeration-safe, so a mail
 * send failure must never propagate out of EmailService.
 */
class EmailServiceTest {

    @Test
    void sendPasswordResetCode_swallowsSendFailure() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doThrow(new MailSendException("smtp unavailable"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        // mailHost non-blank => "configured", so it attempts a real send.
        EmailService service = new EmailService(mailSender, "smtp.example.com", "noreply@libralink.com");

        assertDoesNotThrow(() -> service.sendPasswordResetCode("user@test.com", "123456"));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetCode_skipsSendWhenNotConfigured() {
        JavaMailSender mailSender = mock(JavaMailSender.class);

        // Blank mailHost => not configured => console fallback, no send attempted.
        EmailService service = new EmailService(mailSender, "", "noreply@libralink.com");

        service.sendPasswordResetCode("user@test.com", "123456");
        verifyNoInteractions(mailSender);
    }
}
