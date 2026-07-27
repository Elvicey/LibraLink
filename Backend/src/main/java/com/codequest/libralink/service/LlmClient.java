package com.codequest.libralink.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Single point of contact with the LLM provider (Google AI Studio / Gemini
 * {@code generateContent}). Both {@link AiService} (Ask Libra) and {@link AiExamService}
 * (summaries/questions) go through here so the provider's request/response shape lives in
 * exactly one place — mirroring how {@code PaymentGatewayService} isolates Paystack.
 *
 * <p>Config comes from {@code ai.api.*}: {@code ai.api.url} is the API base
 * (default {@code .../v1beta}), {@code ai.api.key} the AI Studio key (backend-only), and
 * {@code ai.api.model} the model id. A blank key means "not configured"
 * ({@link #isConfigured()} is false) so callers can fall back gracefully instead of 401-ing.
 */
@Service
public class LlmClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    public LlmClient(RestTemplate externalApiRestTemplate,
                     @Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                     @Value("${ai.api.key:}") String apiKey,
                     @Value("${ai.api.model:gemini-flash-latest}") String model) {
        this.restTemplate = externalApiRestTemplate;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Free-form text generation grounded by an optional system instruction. */
    public String generateText(String systemInstruction, String userPrompt) {
        return generate(systemInstruction, userPrompt, false);
    }

    /** Same as {@link #generateText} but asks Gemini to return strict JSON (responseMimeType). */
    public String generateJson(String systemInstruction, String userPrompt) {
        return generate(systemInstruction, userPrompt, true);
    }

    private String generate(String systemInstruction, String userPrompt, boolean jsonMode) {
        if (!isConfigured()) {
            throw new IllegalStateException("AI is not configured (AI_API_KEY is not set).");
        }

        Map<String, Object> genConfig = new LinkedHashMap<>();
        genConfig.put("temperature", 0.7);
        // Gemini 3.x flash models "think" before answering (thinking tokens count against this
        // budget), so keep it generous to avoid truncated/empty completions.
        genConfig.put("maxOutputTokens", 4096);
        if (jsonMode) {
            genConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        if (systemInstruction != null && !systemInstruction.isBlank()) {
            body.put("system_instruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
        }
        body.put("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))));
        body.put("generationConfig", genConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        String url = baseUrl + "/models/" + model + ":generateContent";
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                StringBuilder sb = new StringBuilder();
                for (JsonNode part : parts) {
                    sb.append(part.path("text").asText(""));
                }
                String text = sb.toString().trim();
                if (!text.isEmpty()) {
                    return text;
                }
            }
            throw new IllegalStateException("AI returned no usable text (finishReason: "
                    + candidates.path(0).path("finishReason").asText("unknown") + ")");
        } catch (RestClientException e) {
            throw new IllegalStateException("AI request failed: " + e.getMessage(), e);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("AI response could not be parsed: " + e.getMessage(), e);
        }
    }
}
