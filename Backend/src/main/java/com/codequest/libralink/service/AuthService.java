package com.codequest.libralink.service;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       InstitutionRepository institutionRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.institutionRepository = institutionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(String email, String password) {
        String trimmedEmail = email != null ? email.trim().toLowerCase() : "";
        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return toAuthResponse(user);
    }

    // Medium: registerWithRole does a read (email-exists check), a possible role insert,
    // and the user insert as separate statements. @Transactional has to go on these public
    // entry points rather than on registerWithRole itself - Spring's proxy-based
    // @Transactional has no effect on self-invoked private/internal calls.
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return registerWithRole(request, "STUDENT");
    }

    @Transactional
    public AuthResponse registerLecturer(RegisterRequest request) {
        return registerWithRole(request, "LECTURER");
    }

    @Transactional
    public AuthResponse registerLibrarian(RegisterRequest request) {
        return registerWithRole(request, "LIBRARIAN");
    }

    private AuthResponse registerWithRole(RegisterRequest request, String roleName) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = new User();
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        attachInstitution(user, request.getInstitutionId());

        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        return toAuthResponse(userRepository.save(user));
    }

    private void attachInstitution(User user, Integer institutionId) {
        if (institutionId == null) {
            return;
        }
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Institution not found with id: " + institutionId));
        user.setInstitution(institution);
    }

    private AuthResponse toAuthResponse(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roleNames);
        Integer instId = user.getInstitution() != null ? user.getInstitution().getInstitutionId() : null;
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roleNames, instId);
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
