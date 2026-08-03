package com.codequest.libralink.controller;

import com.codequest.libralink.entity.AuditLog;
import com.codequest.libralink.security.Roles;
import com.codequest.libralink.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Audit logs are a staff-only integrity/forensics tool: they must not be
// forgeable or readable by regular end users. Was hardcoded to
// hasAnyRole('LIBRARIAN', 'ADMIN') - predates the Roles.STAFF mechanical substitution
// done for the multi-tenant retrofit elsewhere, so SCHOOL_ADMIN/PLATFORM_SUPER_ADMIN were
// never actually able to reach any endpoint here despite audit logs existing specifically
// for their oversight.
@PreAuthorize(Roles.STAFF)
@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Lombok removed: explicit constructor added
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<AuditLog> logAction(@Valid @RequestBody AuditLog log) {
        return new ResponseEntity<>(auditLogService.saveLog(log), HttpStatus.CREATED);
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

    // Every other GET here requires already knowing a userId/entityType+id/action to look
    // up - of no use for a general "what's been happening" browse view. Backs the Platform
    // Super Admin audit-log viewer.
    @GetMapping("/recent")
    public ResponseEntity<List<AuditLog>> getRecentLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }
}