package com.codequest.libralink.service;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.RegisterRequest;
import com.codequest.libralink.dto.SchoolAdminSignupRequest;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.InviteCode;
import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.dto.SchoolAdminJoinRequest;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.JwtUtil;
import com.codequest.libralink.security.SchoolContext;
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
    private final InviteCodeService inviteCodeService;
    private final SchoolContext schoolContext;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       InstitutionRepository institutionRepository,
                       InviteCodeService inviteCodeService,
                       SchoolContext schoolContext,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.institutionRepository = institutionRepository;
        this.inviteCodeService = inviteCodeService;
        this.schoolContext = schoolContext;
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

        assertSchoolNotSuspended(user.getInstitution());

        return toAuthResponse(user);
    }

    public AuthResponse register(RegisterRequest request) {
        return registerWithRole(request, "STUDENT");
    }

    /**
     * Unchanged bearer-token gate (caller must already hold LIBRARIAN/ADMIN/SCHOOL_ADMIN -
     * enforced by @PreAuthorize at the controller) PLUS a required librarianCode, issued by
     * a School Admin and scoped to the caller's own school - additive layering, not a
     * replacement of the existing gate, since no code concept existed here before.
     */
    @Transactional
    public AuthResponse registerLibrarian(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Integer callerSchoolId = schoolContext.requireSchoolId();
        InviteCode code = inviteCodeService.findValid(
                request.getLibrarianCode(), InviteCodeService.TYPE_LIBRARIAN_CODE, null, callerSchoolId);
        assertSchoolNotSuspended(code.getSchool());

        User user = new User();
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setInstitution(code.getSchool());

        Role role = roleRepository.findByName("LIBRARIAN")
                .orElseGet(() -> roleRepository.save(new Role("LIBRARIAN")));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        user = userRepository.save(user);

        inviteCodeService.consume(code, user.getId());

        return toAuthResponse(user);
    }

    /**
     * Public join for an ADDITIONAL School Admin at an existing school, gated by an
     * existing School Admin-issued OTP (email-bound, 15 min expiry, single-use).
     */
    @Transactional
    public AuthResponse schoolAdminJoin(SchoolAdminJoinRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        InviteCode code = inviteCodeService.findValid(
                request.getOtp(), InviteCodeService.TYPE_SCHOOL_ADMIN_OTP, email, null);
        Institution school = code.getSchool();
        assertSchoolNotSuspended(school);

        User user = new User();
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setInstitution(school);

        Role role = roleRepository.findByName("SCHOOL_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("SCHOOL_ADMIN")));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        user = userRepository.save(user);

        inviteCodeService.consume(code, user.getId());

        return toAuthResponse(user);
    }

    /**
     * Public signup for the FIRST School Admin of a school, gated by a Platform Super
     * Admin-issued school_code (single-use, no expiry per spec). The code determines which
     * school the account is scoped to - not any client-supplied institutionId.
     */
    @Transactional
    public AuthResponse schoolAdminSignup(SchoolAdminSignupRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        InviteCode code = inviteCodeService.findValid(
                request.getSchoolCode(), InviteCodeService.TYPE_SCHOOL_CODE, null, null);
        Institution school = code.getSchool();
        assertSchoolNotSuspended(school);

        User user = new User();
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setInstitution(school);

        Role role = roleRepository.findByName("SCHOOL_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("SCHOOL_ADMIN")));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        user = userRepository.save(user);

        inviteCodeService.consume(code, user.getId());

        return toAuthResponse(user);
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

    /**
     * These permitAll() auth endpoints never go through SchoolSuspensionFilter (there's no
     * JWT yet at login/signup time), so suspension has to be checked explicitly here - the
     * Institution is already loaded in every caller, so this is a free in-memory check, not
     * an extra query. Null-safe: a null institution (only possible for a PLATFORM_SUPER_ADMIN
     * login, who has none) always passes.
     */
    private void assertSchoolNotSuspended(Institution school) {
        if (school != null && "SUSPENDED".equals(school.getStatus())) {
            throw new IllegalArgumentException("This school has been suspended.");
        }
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
        Integer instId = user.getInstitution() != null ? user.getInstitution().getInstitutionId() : null;
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roleNames, instId);
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roleNames, instId);
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
