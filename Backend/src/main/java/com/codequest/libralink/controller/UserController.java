package com.codequest.libralink.controller;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.service.RoleService;
import com.codequest.libralink.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final RoleService roleService;

    public UserController(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/{id}/roles")
    public ResponseEntity<?> assignRole(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "role is required"));
        }
        try {
            User updated = roleService.assignRoleToUser(id, roleName);
            return ResponseEntity.ok(Map.of(
                    "userId", updated.getId(),
                    "roles", updated.getRoles().stream().map(r -> r.getName()).toList()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/push-token")
    public ResponseEntity<Map<String, String>> updatePushToken(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String token = body.get("pushToken");
        userService.updatePushToken(id, token);
        return ResponseEntity.ok(Map.of("message", "Push token updated"));
    }
}