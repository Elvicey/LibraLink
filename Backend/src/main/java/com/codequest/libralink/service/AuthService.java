package com.codequest.libralink.service;

import com.codequest.libralink.dto.AuthResponse;
import com.codequest.libralink.dto.EmailVerificationPendingResponse;
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
    private final EmailVerificationService emailVerificationService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       InstitutionRepository institutionRepository,
                       InviteCodeService inviteCodeService,
                       SchoolContext schoolContext,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.institutionRepository = institutionRepository;
        this.inviteCodeService = inviteCodeService;
        this.schoolContext = schoolContext;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailVerificationService = emailVerificationService;
    }

    public AuthResponse login(String email, String password) {
        String trimmedEmail = email != null ? email.trim().toLowerCase() : "";
        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Please verify your email before logging in.");
        }

        assertSchoolNotSuspended(user.getInstitution());

        return toAuthResponse(user);
    }

    /** Confirms a student self-registration's emailed code and, only then, issues a session. */
    @Transactional
    public AuthResponse verifyEmail(String email, String code) {
        User user = emailVerificationService.confirmCode(email, code);
        assertSchoolNotSuspended(user.getInstitution());
        return toAuthResponse(user);
    }

    /**
     * Re-sends a fresh code for an account that registered but hasn't verified yet.
     * Silently no-ops for a missing/already-verified account (non-committal, same
     * enumeration-safety convention as {@link PasswordResetService#requestReset}).
     */
    public void resendVerificationCode(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> emailVerificationService.sendCode(normalizedEmail));
    }

    @Transactional
    public void changePassword(Integer userId, String currentPassword, String newPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Medium: registerWithRole does a read (email-exists check), a possible role insert,
    // and the user insert as separate statements. @Transactional has to go on these public
    // entry points rather than on registerWithRole itself - Spring's proxy-based
    // @Transactional has no effect on self-invoked private/internal calls.
    @Transactional
    public EmailVerificationPendingResponse register(RegisterRequest request) {
        User user = registerWithRole(request, "STUDENT");
        emailVerificationService.sendCode(user.getEmail());
        return new EmailVerificationPendingResponse(user.getEmail(),
                "Account created. Enter the verification code sent to your email to finish signing in.");
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

    // Sole caller is register() (student self-registration) - the emailVerified(false) here
    // is deliberately unconditional rather than gated on roleName, since no other caller
    // exists for this method.
    private User registerWithRole(RegisterRequest request, String roleName) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // Librarians don't know students' internal numeric ids - student number is the
        // lookup key staff actually use (CirculationScan/FinesLookup), so it's required
        // and unique from the moment a student account is created.
        String studentId = request.getStudentId() != null ? request.getStudentId().trim() : "";
        if (studentId.isEmpty()) {
            throw new IllegalArgumentException("Student ID is required");
        }
        if (!studentId.matches("\\d{8}")) {
            throw new IllegalArgumentException("Student ID must be 8 digits");
        }
        if (userRepository.findByStudentId(studentId).isPresent()) {
            throw new IllegalArgumentException("An account with this student ID already exists");
        }

        User user = new User();
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStudentId(studentId);
        user.setActive(true);
        user.setEmailVerified(false);
        attachInstitution(user, request.getInstitutionId());
        assertEmailMatchesSchoolDomain(email, user.getInstitution());

        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        return userRepository.save(user);
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

    /**
     * A school with no configured emailDomain (every school by default) accepts any email -
     * the restriction only activates once a Platform Super Admin sets one. Case-insensitive
     * suffix match, so configuring "knust.edu.gh" also allows "st.knust.edu.gh"; a school
     * that wants ONLY the subdomain must configure that subdomain string itself.
     */
    private void assertEmailMatchesSchoolDomain(String email, Institution school) {
        if (school == null) {
            return;
        }
        String domain = school.getEmailDomain();
        if (domain == null || domain.isBlank()) {
            return;
        }
        String emailDomainPart = email.contains("@") ? email.substring(email.indexOf('@') + 1) : "";
        if (!emailDomainPart.endsWith(domain.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Please register with your " + school.getName() + " email address (must end in @" + domain + ").");
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
        String shortName = user.getInstitution() != null ? user.getInstitution().getShortName() : null;
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roleNames, instId);
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roleNames, instId, shortName);
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
