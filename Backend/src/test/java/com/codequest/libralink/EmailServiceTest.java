package com.codequest.libralink;

import com.codequest.libralink.service.BrevoEmailClient;
import com.codequest.libralink.service.EmailService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * The forgot-password endpoint must stay non-500 and email-enumeration-safe, so a mail
 * send failure must never propagate out of EmailService.
 */
class EmailServiceTest {

    @Test
    void sendPasswordResetCode_swallowsSendFailure() {
        BrevoEmailClient brevoEmailClient = mock(BrevoEmailClient.class);
        doReturn(true).when(brevoEmailClient).isConfigured();
        doThrow(new IllegalStateException("Brevo unavailable"))
                .when(brevoEmailClient).sendEmail(anyString(), anyString(), anyString());

        EmailService service = new EmailService(brevoEmailClient);

        assertDoesNotThrow(() -> service.sendPasswordResetCode("user@test.com", "123456"));
        verify(brevoEmailClient).sendEmail(any(), any(), any());
    }

    @Test
    void sendPasswordResetCode_skipsSendWhenNotConfigured() {
        BrevoEmailClient brevoEmailClient = mock(BrevoEmailClient.class);
        doReturn(false).when(brevoEmailClient).isConfigured();

        EmailService service = new EmailService(brevoEmailClient);

        service.sendPasswordResetCode("user@test.com", "123456");
        verify(brevoEmailClient, never()).sendEmail(any(), any(), any());
    }
}
