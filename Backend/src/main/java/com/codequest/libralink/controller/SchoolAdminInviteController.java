package com.codequest.libralink.controller;

import com.codequest.libralink.dto.InviteSchoolAdminRequest;
import com.codequest.libralink.security.Roles;
import com.codequest.libralink.service.StaffInviteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Existing School Admin inviting a co-School-Admin via OTP. See AuthController for the
 *  public school-admin-join endpoint that consumes the OTP this issues. */
@RestController
@RequestMapping("/api/school-admins")
public class SchoolAdminInviteController {

    private final StaffInviteService staffInviteService;

    public SchoolAdminInviteController(StaffInviteService staffInviteService) {
        this.staffInviteService = staffInviteService;
    }

    @PreAuthorize(Roles.SCHOOL_ADMIN_ONLY)
    @PostMapping("/invite")
    public ResponseEntity<?> invite(@Valid @RequestBody InviteSchoolAdminRequest request) {
        try {
            return ResponseEntity.status(201).body(staffInviteService.inviteSchoolAdmin(request.getEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
