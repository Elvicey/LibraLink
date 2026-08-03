package com.codequest.libralink.controller;

import com.codequest.libralink.security.Roles;
import com.codequest.libralink.service.StaffInviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** School Admin issuing a librarian_code, scoped to their own school. Librarians cannot
 *  mint these (SCHOOL_ADMIN_ONLY, not STAFF). See AuthController#registerLibrarian, which
 *  now requires one. */
@RestController
@RequestMapping("/api/librarian-codes")
public class LibrarianCodeController {

    private final StaffInviteService staffInviteService;

    public LibrarianCodeController(StaffInviteService staffInviteService) {
        this.staffInviteService = staffInviteService;
    }

    @PreAuthorize(Roles.SCHOOL_ADMIN_ONLY)
    @PostMapping
    public ResponseEntity<?> issue() {
        try {
            return ResponseEntity.status(201).body(staffInviteService.issueLibrarianCode());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
