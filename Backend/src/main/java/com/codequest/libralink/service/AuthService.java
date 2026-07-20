package com.codequest.libralink.service;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        Integer instId = user.getInstitution() != null ? user.getInstitution().getInstitutionId() : null;

        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roles, instId);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        String roleName = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase() : "STUDENT";
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail());
        List<String> roleNames = saved.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        Integer instId = saved.getInstitution() != null ? saved.getInstitution().getInstitutionId() : null;

        return new AuthResponse(token, saved.getId(), saved.getEmail(),
                saved.getFirstName(), saved.getLastName(), roleNames, instId);
    }
}
