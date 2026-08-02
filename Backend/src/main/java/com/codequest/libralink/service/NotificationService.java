package com.codequest.libralink.service;

import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

<<<<<<< HEAD
    private final NotificationRepository notificationRepository;
    private final ExpoPushNotificationService expoPushNotificationService;

    public NotificationService(NotificationRepository notificationRepository,
                               ExpoPushNotificationService expoPushNotificationService) {
=======
    public NotificationService(NotificationRepository notificationRepository) {
>>>>>>> origin/main
        this.notificationRepository = notificationRepository;
        this.expoPushNotificationService = expoPushNotificationService;
    }

    // CREATE notification
    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
<<<<<<< HEAD
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
=======
        notification.setIsRead(false); // default value
        return notificationRepository.save(notification);
>>>>>>> origin/main
    }

    // GET ALL notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // GET notifications for a specific user
    public List<Notification> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserId(userId);
    }

    // MARK AS READ
    public Notification markAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

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
