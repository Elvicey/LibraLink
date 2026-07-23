package com.codequest.libralink.service;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public AuditLog saveLog(AuditLog log) {
        // Never trust a client-supplied id/createdAt on create (H7/H6) - a forged id could
        // overwrite an unrelated existing audit record instead of creating a new one.
        log.setId(null);
        log.setCreatedAt(LocalDateTime.now());
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getLogsByUser(Integer userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public List<AuditLog> getLogsByEntity(String entityType, Integer entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<AuditLog> getLogsByAction(String action) {
        return auditLogRepository.findByAction(action);
    }
}