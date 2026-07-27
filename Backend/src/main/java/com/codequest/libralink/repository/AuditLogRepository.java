package com.codequest.libralink.repository;

import com.codequest.libralink.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByUserId(Integer userId);
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Integer entityId);

    // Capped (H9): this backs a staff-only "browse all audit logs for an action" endpoint
    // with no other filter and no upper time bound, so without a limit it would return
    // every matching row ever recorded as the table grows. Ordered by recency so the cap
    // still returns the most useful/current rows; proper pagination is a follow-up.
    List<AuditLog> findTop1000ByActionOrderByCreatedAtDesc(String action);
}