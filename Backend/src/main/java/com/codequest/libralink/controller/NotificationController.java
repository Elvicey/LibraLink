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

<<<<<<< HEAD
    @PreAuthorize("hasRole('LIBRARIAN')")
=======
    // CREATE notification
>>>>>>> origin/main
    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.createNotification(notification));
    }

<<<<<<< HEAD
    @PreAuthorize("hasRole('LIBRARIAN')")
=======
    // GET ALL notifications  👈 ADD THIS (fixes your GET issue)
>>>>>>> origin/main
    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

<<<<<<< HEAD
=======
    // GET notifications by user
>>>>>>> origin/main
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    // MARK AS READ
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Integer id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(@PathVariable Integer userId) {
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("marked", count));
    }
}
