package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserId(Integer userId);
    List<Notification> findByUserIdAndIsRead(Integer userId, Boolean isRead);
    List<Notification> findByReferenceIdAndReferenceType(Integer referenceId, String referenceType);

    // Capped (H9): backs a staff-only "browse every notification in the system" endpoint
    // with no filter at all; plain findAll() would return every row ever sent as the
    // table grows. Ordered by recency; proper pagination is a follow-up.
    List<Notification> findTop1000ByOrderByCreatedAtDesc();

    // Medium (N+1): markAllAsRead used to fetch every unread row and save() each one
    // individually (N update statements). One bulk UPDATE instead.
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") Integer userId, @Param("now") LocalDateTime now);
}