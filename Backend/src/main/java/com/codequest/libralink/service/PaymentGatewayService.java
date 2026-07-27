package com.codequest.libralink.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Thin client over the Paystack REST API for the fine-payment flow. Only two calls are
 * needed: {@code initialize} (hand the app a hosted-checkout URL) and {@code verify}
 * (confirm, server-side, that money actually changed hands before we mark a fine paid).
 *
 * <p>The secret key never leaves the backend. All money amounts crossing this boundary
 * are in the currency's minor unit (pesewas for GHS), which is what Paystack expects.
 * A blank secret key means "not configured": callers should treat {@link #isConfigured()}
 * as false and surface a 503, rather than attempting a call that would 401.
 */
@Service
public class PaymentGatewayService {

    private final RestTemplate restTemplate;
    private final String secretKey;
    private final String publicKey;
    private final String baseUrl;
    private final String currency;

    public PaymentGatewayService(RestTemplate externalApiRestTemplate,
                                 @Value("${paystack.secret-key:}") String secretKey,
                                 @Value("${paystack.public-key:}") String publicKey,
                                 @Value("${paystack.base-url:https://api.paystack.co}") String baseUrl,
                                 @Value("${paystack.currency:GHS}") String currency) {
        this.restTemplate = externalApiRestTemplate;
        this.secretKey = secretKey;
        this.publicKey = publicKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.currency = currency;
    }

    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank();
    }

    public String getPublicKey() {
        return publicKey;
    }

    /** Result of a Paystack transaction/initialize call. */
    public record InitResult(String authorizationUrl, String reference, String accessCode) {}

    /**
     * Result of a Paystack transaction/verify call. {@code amountMinor} is the amount
     * actually paid, in pesewas; {@code fineId}/{@code userId} are read back from the
     * metadata we attached at initialize time (so they can be trusted here).
     */
    public record VerifyResult(boolean success, String gatewayStatus, long amountMinor,
                               String currency, Integer fineId, Integer userId) {}

    /**
     * Create a hosted-checkout session for a GHS amount and return its authorization URL.
     * The fine/user ids are stored in Paystack metadata so verify can recover them.
     */
    public InitResult initialize(String email, BigDecimal amountGhs, String reference,
                                 Integer fineId, Integer userId, String callbackUrl) {
        requireConfigured();

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("fineId", fineId);
        metadata.put("userId", userId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("amount", toMinorUnits(amountGhs));
        body.put("currency", currency);
        body.put("reference", reference);
        body.put("metadata", metadata);
        // When set, Paystack redirects here after checkout so the app can detect completion
        // (an app deep link, e.g. libralink://...). Without it the flow relies on the user
        // closing the browser, which is unreliable on Android.
        if (callbackUrl != null && !callbackUrl.isBlank()) {
            body.put("callback_url", callbackUrl);
        }

        Map<String, Object> data = postForData("/transaction/initialize", body);
        return new InitResult(
                str(data.get("authorization_url")),
                str(data.get("reference")),
                str(data.get("access_code")));
    }

    /** Confirm the outcome of a transaction by its reference. */
    public VerifyResult verify(String reference) {
        requireConfigured();

        Map<String, Object> data = getForData("/transaction/verify/" + reference);
        String gatewayStatus = str(data.get("status")); // "success" | "failed" | "abandoned" | ...
        long amountMinor = data.get("amount") instanceof Number n ? n.longValue() : 0L;
        String txCurrency = str(data.get("currency"));

        Integer fineId = null;
        Integer userId = null;
        if (data.get("metadata") instanceof Map<?, ?> meta) {
            fineId = toInt(meta.get("fineId"));
            userId = toInt(meta.get("userId"));
        }
        return new VerifyResult("success".equalsIgnoreCase(gatewayStatus),
                gatewayStatus, amountMinor, txCurrency, fineId, userId);
    }

    // --- helpers ---

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException("Payments are not configured (PAYSTACK_SECRET_KEY is not set).");
        }
    }

    /** GHS BigDecimal -> integer pesewas (Paystack's minor unit). */
    private long toMinorUnits(BigDecimal amountGhs) {
        return amountGhs.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postForData(String path, Map<String, Object> body) {
        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            Map<String, Object> response = restTemplate.postForObject(
                    baseUrl + path, new HttpEntity<>(body, headers), Map.class);
            return dataOf(response);
        } catch (RestClientException e) {
            throw new IllegalStateException("Paystack request failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getForData(String path) {
        try {
            Map<String, Object> response = restTemplate.exchange(
                    baseUrl + path, org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(authHeaders()), Map.class).getBody();
            return dataOf(response);
        } catch (RestClientException e) {
            throw new IllegalStateException("Paystack request failed: " + e.getMessage(), e);
        }
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> dataOf(Map<String, Object> response) {
        if (response == null || !Boolean.TRUE.equals(response.get("status"))) {
            String message = response == null ? "empty response" : str(response.get("message"));
            throw new IllegalStateException("Paystack error: " + message);
        }
        Object data = response.get("data");
        if (!(data instanceof Map)) {
            throw new IllegalStateException("Paystack response had no data object.");
        }
        return (Map<String, Object>) data;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static Integer toInt(Object o) {
        if (o instanceof Number n) {
            return n.intValue();
        }
        try {
            return o == null ? null : Integer.valueOf(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
