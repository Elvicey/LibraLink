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

    public Role saveRole(Role role) {
        // Never trust a client-supplied id on create (H7): a forged id could rename an
        // existing role (e.g. ADMIN) instead of creating a new one.
        role.setId(null);
        return roleRepository.save(role);
    }

    public User assignRoleToUser(Integer userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseGet(() -> roleRepository.save(new Role(roleName.toUpperCase())));
        user.getRoles().add(role);
        return userRepository.save(user);
    }
}