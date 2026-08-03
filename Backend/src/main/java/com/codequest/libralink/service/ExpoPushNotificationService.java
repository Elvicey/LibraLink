package com.codequest.libralink.service;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ExpoPushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${expo.push.enabled:false}")
    private boolean pushEnabled;

    public ExpoPushNotificationService(UserRepository userRepository,
                                       RestTemplate externalApiRestTemplate) {
        this.userRepository = userRepository;
        this.restTemplate = externalApiRestTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public void sendPushNotification(Integer userId, String title, String body, Map<String, Object> data) {
        if (!pushEnabled) {
            log.debug("Push notifications disabled. Skipping send to user {}", userId);
            return;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getPushToken() == null || user.getPushToken().isBlank()) {
            log.warn("No push token found for user {}", userId);
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                    "to", user.getPushToken(),
                    "title", title,
                    "body", body,
                    "sound", "default",
                    "data", data != null ? data : Map.of()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode responseBody = objectMapper.readTree(response.getBody());
                if (responseBody.has("data") && responseBody.get("data").has("status")) {
                    String status = responseBody.get("data").get("status").asText();
                    if ("ok".equals(status)) {
                        log.info("Push notification sent to user {} successfully", userId);
                    } else {
                        log.warn("Push notification failed for user {}: {}", userId,
                                responseBody.get("data").has("message")
                                        ? responseBody.get("data").get("message").asText() : "unknown error");
                    }
                }
            } else {
                log.error("Expo push API returned status {} for user {}", response.getStatusCode(), userId);
            }
        } catch (Exception e) {
            log.error("Failed to send push notification to user {}: {}", userId, e.getMessage());
        }
    }

    public void sendOverdueNotification(Integer userId, String bookTitle, String dueDate) {
        sendPushNotification(userId,
                "Book Overdue",
                "Your book \"" + bookTitle + "\" was due on " + dueDate + ". Please return it.",
                Map.of("type", "OVERDUE", "bookTitle", bookTitle));
    }

    public void sendReservationReady(Integer userId, String bookTitle) {
        sendPushNotification(userId,
                "Reservation Ready",
                "Your reserved book \"" + bookTitle + "\" is ready for pickup.",
                Map.of("type", "RESERVATION_READY", "bookTitle", bookTitle));
    }

    public void sendBorrowConfirmation(Integer userId, String bookTitle) {
        sendPushNotification(userId,
                "Book Borrowed",
                "You have successfully borrowed \"" + bookTitle + "\".",
                Map.of("type", "BORROW", "bookTitle", bookTitle));
    }
}
