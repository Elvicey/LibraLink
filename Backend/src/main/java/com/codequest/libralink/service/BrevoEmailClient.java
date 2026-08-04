package com.codequest.libralink.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin client over Brevo's transactional email REST API ({@code POST /v3/smtp/email}),
 * used for email-verification codes - mirrors how {@link com.codequest.libralink.service.PaymentGatewayService}
 * isolates Paystack and {@link LlmClient} isolates Gemini. Unlike {@link EmailService}
 * (SMTP via JavaMailSender, used for password-reset codes), this talks to Brevo's API
 * directly over HTTPS with an API key - no SMTP credentials involved.
 *
 * <p>A blank API key means "not configured" ({@link #isConfigured()} is false); callers
 * should surface that as a real failure rather than silently swallowing it, since without
 * a delivered code the caller has no way to ever verify their account.
 */
@Service
public class BrevoEmailClient {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;
    private final String senderEmail;
    private final String senderName;

    public BrevoEmailClient(RestTemplate externalApiRestTemplate,
                            @Value("${brevo.api-key:}") String apiKey,
                            @Value("${brevo.base-url:https://api.brevo.com/v3}") String baseUrl,
                            @Value("${brevo.sender-email:noreply@libralink.com}") String senderEmail,
                            @Value("${brevo.sender-name:LibraLink}") String senderName) {
        this.restTemplate = externalApiRestTemplate;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Sends a single transactional HTML email. Throws if not configured or the send fails. */
    public void sendEmail(String toEmail, String subject, String htmlContent) {
        if (!isConfigured()) {
            throw new IllegalStateException("Email sending is not configured (BREVO_API_KEY is not set).");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sender", Map.of("name", senderName, "email", senderEmail));
        body.put("to", List.of(Map.of("email", toEmail)));
        body.put("subject", subject);
        body.put("htmlContent", htmlContent);

        try {
            restTemplate.postForObject(baseUrl + "/smtp/email", new HttpEntity<>(body, headers), Map.class);
        } catch (RestClientException e) {
            throw new IllegalStateException("Failed to send email via Brevo: " + e.getMessage(), e);
        }
    }
}
