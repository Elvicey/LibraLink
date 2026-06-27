package com.codequest.libralink.service;

import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // CREATE notification
    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false); // default value
        return notificationRepository.save(notification);
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
}