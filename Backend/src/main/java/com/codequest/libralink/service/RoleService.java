package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoleService {
    @Autowired private RoleRepository roleRepository;
    public Role saveRole(Role role) { return roleRepository.save(role); }
}