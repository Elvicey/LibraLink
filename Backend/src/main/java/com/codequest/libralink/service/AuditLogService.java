package com.codequest.libralink.service;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.repository.AuditLogRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final SchoolContext schoolContext;

    public AuditLogService(AuditLogRepository auditLogRepository, SchoolContext schoolContext) {
        this.auditLogRepository = auditLogRepository;
        this.schoolContext = schoolContext;
    }

    public AuditLog saveLog(AuditLog log) {
        // Never trust a client-supplied id/createdAt on create (H7/H6) - a forged id could
        // overwrite an unrelated existing audit record instead of creating a new one.
        log.setId(null);
        log.setSchoolId(schoolContext.requireSchoolId());
        log.setCreatedAt(LocalDateTime.now());
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getLogsByUser(Integer userId) {
        return scoped(auditLogRepository.findByUserId(userId));
    }

    public List<AuditLog> getLogsByEntity(String entityType, Integer entityId) {
        return scoped(auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId));
    }

    public List<AuditLog> getLogsByAction(String action) {
        return scoped(auditLogRepository.findTop1000ByActionOrderByCreatedAtDesc(action));
    }

    public List<AuditLog> getRecentLogs() {
        return scoped(auditLogRepository.findTop1000ByOrderByCreatedAtDesc());
    }

    private List<AuditLog> scoped(List<AuditLog> logs) {
        if (schoolContext.isPlatformSuperAdmin()) {
            return logs;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return logs.stream().filter(l -> schoolId.equals(l.getSchoolId())).toList();
    }
}