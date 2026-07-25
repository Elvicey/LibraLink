package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class RoleService {
    // The only roles a caller may assign. Anything else is rejected outright rather than
    // silently created, so a typo (or a forged role string) can never mint a new role.
    private static final Set<String> ASSIGNABLE_ROLES = Set.of("STUDENT", "LIBRARIAN", "ADMIN");

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public Role saveRole(Role role) {
        // Never trust a client-supplied id on create (H7): a forged id could rename an
        // existing role (e.g. ADMIN) instead of creating a new one.
        role.setId(null);
        return roleRepository.save(role);
    }

    @Transactional
    public User assignRoleToUser(Integer userId, String roleName) {
        String normalized = roleName != null ? roleName.trim().toUpperCase() : "";
        if ("LECTURER".equals(normalized)) {
            throw new IllegalArgumentException("Lecturer role is no longer supported");
        }
        if (!ASSIGNABLE_ROLES.contains(normalized)) {
            throw new IllegalArgumentException("Unknown or unassignable role: " + roleName);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role role = roleRepository.findByName(normalized)
                .orElseGet(() -> roleRepository.save(new Role(normalized)));
        user.getRoles().add(role);
        return userRepository.save(user);
    }
}