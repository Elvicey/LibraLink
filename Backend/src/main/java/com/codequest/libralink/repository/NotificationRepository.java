package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserId(Integer userId);
    List<Notification> findByUserIdAndIsRead(Integer userId, Boolean isRead);
    List<Notification> findByReferenceIdAndReferenceType(Integer referenceId, String referenceType);

    // Capped (H9): backs a staff-only "browse every notification in the system" endpoint
    // with no filter at all; plain findAll() would return every row ever sent as the
    // table grows. Ordered by recency; proper pagination is a follow-up.
    List<Notification> findTop1000ByOrderByCreatedAtDesc();
}