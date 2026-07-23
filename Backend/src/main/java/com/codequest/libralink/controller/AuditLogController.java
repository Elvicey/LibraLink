package com.codequest.libralink.controller;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Audit logs are a staff-only integrity/forensics tool: they must not be
// forgeable or readable by regular end users.
@PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Lombok removed: explicit constructor added
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<AuditLog> logAction(@RequestBody AuditLog log) {
        return ResponseEntity.ok(auditLogService.saveLog(log));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLog>> getLogsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(auditLogService.getLogsByUser(userId));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getLogsByEntity(
            @PathVariable String entityType,
            @PathVariable Integer entityId) {
        return ResponseEntity.ok(auditLogService.getLogsByEntity(entityType, entityId));
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getLogsByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditLogService.getLogsByAction(action));
    }
}