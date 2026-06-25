package com.codequest.libralink.repository;

import com.codequest.libralink.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByUserId(Integer userId);
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Integer entityId);
    List<AuditLog> findByAction(String action);
}