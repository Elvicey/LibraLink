package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoleService {
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;

    public Role saveRole(Role role) { return roleRepository.save(role); }

    public User assignRoleToUser(Integer userId, String roleName) {
        String normalized = roleName != null ? roleName.trim().toUpperCase() : "";
        if ("LECTURER".equals(normalized)) {
            throw new IllegalArgumentException("Lecturer role is no longer supported");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role role = roleRepository.findByName(normalized)
                .orElseGet(() -> roleRepository.save(new Role(normalized)));
        user.getRoles().add(role);
        return userRepository.save(user);
    }
}