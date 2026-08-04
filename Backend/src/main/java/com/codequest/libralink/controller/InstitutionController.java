package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.security.Roles;
import com.codequest.libralink.service.InstitutionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/institutions")
public class InstitutionController {

    @Autowired
    private InstitutionService institutionService;

    // Narrowed to platform-only (was staff-wide): POST /api/schools (Phase 3) is the real
    // school-creation path now; this raw-JSON endpoint previously let any Librarian/Admin
    // create untracked schools with no code/validation.
    @PreAuthorize(Roles.PLATFORM_ADMIN_ONLY)
    @PostMapping
    public ResponseEntity<Institution> createInstitution(@Valid @RequestBody Institution institution) {
        return new ResponseEntity<>(institutionService.createInstitution(institution), HttpStatus.CREATED);
    }

    @GetMapping
    public List<Institution> getAllInstitutions() {
        return institutionService.getAllInstitutions();
    }
}