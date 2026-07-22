package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserId(Integer userId);
    List<Notification> findByUserIdAndIsRead(Integer userId, Boolean isRead);
    List<Notification> findByReferenceIdAndReferenceType(Integer referenceId, String referenceType);
}