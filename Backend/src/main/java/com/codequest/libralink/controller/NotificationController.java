package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.createNotification(notification));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Integer id) {
        // Ownership of the notification (by id) is verified inside the service,
        // since the notification's owning userId isn't known until it's fetched.
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(@PathVariable Integer userId) {
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("marked", count));
    }
}
