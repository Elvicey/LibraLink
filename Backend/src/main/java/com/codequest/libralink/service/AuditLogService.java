package com.codequest.libralink.service;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.repository.AuditLogRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * For services logging a real action as it happens - unlike {@link #saveLog}, which
     * backs the generic staff-facing POST /api/audit-logs endpoint and derives schoolId
     * from the caller via SchoolContext, this takes schoolId explicitly since the right
     * value differs by call site: the acting staff member's own school for most actions,
     * but the TARGET school when a PLATFORM_SUPER_ADMIN acts cross-school (e.g. suspending
     * a school they don't belong to). Callers should skip logging entirely rather than
     * pass null - schoolId is NOT NULL on the entity (e.g. a PLATFORM_SUPER_ADMIN login,
     * who has no school at all, is simply never logged).
     */
    @Transactional
    public void log(Integer userId, Integer schoolId, String action, String entityType,
                     Integer entityId, String details) {
        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setSchoolId(schoolId);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        entry.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(entry);
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