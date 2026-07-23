package com.codequest.libralink.service;

import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.NotificationRepository;
import com.codequest.libralink.security.CurrentUserProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final ExpoPushNotificationService expoPushNotificationService;
    private final CurrentUserProvider currentUserProvider;

    public NotificationService(NotificationRepository notificationRepository,
                               ExpoPushNotificationService expoPushNotificationService,
                               CurrentUserProvider currentUserProvider) {
        this.notificationRepository = notificationRepository;
        this.expoPushNotificationService = expoPushNotificationService;
        this.currentUserProvider = currentUserProvider;
    }

    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);
        Notification saved = notificationRepository.save(notification);

        try {
            expoPushNotificationService.sendPushNotification(
                    saved.getUserId(),
                    saved.getTitle(),
                    saved.getMessage(),
                    Map.of(
                            "type", saved.getType() != null ? saved.getType() : "GENERAL",
                            "referenceId", saved.getReferenceId() != null ? saved.getReferenceId() : 0,
                            "referenceType", saved.getReferenceType() != null ? saved.getReferenceType() : ""
                    )
            );
        } catch (Exception e) {
            log.warn("Failed to send push notification to user {}: {}", saved.getUserId(), e.getMessage());
        }

        return saved;
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserId(userId);
    }

    public Notification markAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));

        currentUserProvider.requireSelfOrAnyRole(notification.getUserId(), "LIBRARIAN", "ADMIN");

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    public int markAllAsRead(Integer userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsRead(userId, false);
        int count = 0;
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
            count++;
        }
        return count;
    }
}
