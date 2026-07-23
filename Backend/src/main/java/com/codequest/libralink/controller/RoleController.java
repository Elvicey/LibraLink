package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roles")
public class RoleController {
    @Autowired private RoleService roleService;

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public Role createRole(@Valid @RequestBody Role role) {
        return roleService.saveRole(role);
    }
}