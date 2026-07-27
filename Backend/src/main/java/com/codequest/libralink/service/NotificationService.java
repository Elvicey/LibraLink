package com.codequest.libralink.service;

import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.NotificationRepository;
import com.codequest.libralink.security.SchoolContext;
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
    private final SchoolContext schoolContext;

    public NotificationService(NotificationRepository notificationRepository,
                               ExpoPushNotificationService expoPushNotificationService,
                               SchoolContext schoolContext) {
        this.notificationRepository = notificationRepository;
        this.expoPushNotificationService = expoPushNotificationService;
        this.schoolContext = schoolContext;
    }

    public Notification createNotification(Notification notification) {
        // Most call sites derive and set schoolId themselves (from the related book/course/
        // reservation); only stamp from the request context as a fallback for callers (like
        // the direct staff POST /api/notifications endpoint) that don't set it.
        if (notification.getSchoolId() == null) {
            notification.setSchoolId(schoolContext.currentSchoolId());
        }
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
        return scoped(notificationRepository.findAll());
    }

    public List<Notification> getUserNotifications(Integer userId) {
        return scoped(notificationRepository.findByUserId(userId));
    }

    private List<Notification> scoped(List<Notification> notifications) {
        if (schoolContext.isPlatformSuperAdmin()) {
            return notifications;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return notifications.stream().filter(n -> schoolId.equals(n.getSchoolId())).toList();
    }

    public Notification markAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));

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
