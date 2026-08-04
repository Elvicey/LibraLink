package com.codequest.libralink.controller;

import com.codequest.libralink.dto.CreateSchoolRequest;
import com.codequest.libralink.dto.SchoolResponse;
import com.codequest.libralink.dto.UpdateSchoolRequest;
import com.codequest.libralink.security.Roles;
import com.codequest.libralink.service.SchoolService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Platform Super Admin only - create/list/manage schools. See AuthController for the
 *  public school-admin-signup endpoint that consumes the school_code this issues. */
@RestController
@RequestMapping("/api/schools")
@PreAuthorize(Roles.PLATFORM_ADMIN_ONLY)
public class SchoolController {

    private final SchoolService schoolService;

    public SchoolController(SchoolService schoolService) {
        this.schoolService = schoolService;
    }

    @PostMapping
    public ResponseEntity<?> createSchool(@Valid @RequestBody CreateSchoolRequest request) {
        try {
            return ResponseEntity.status(201).body(schoolService.createSchool(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SchoolResponse>> listSchools() {
        return ResponseEntity.ok(schoolService.listSchools());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateSchool(@PathVariable Integer id, @RequestBody UpdateSchoolRequest request) {
        try {
            return ResponseEntity.ok(schoolService.updateSchool(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
