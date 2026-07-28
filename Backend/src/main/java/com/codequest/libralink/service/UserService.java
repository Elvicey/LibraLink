package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.exception.ResourceNotFoundException;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.SchoolContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolContext schoolContext;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, SchoolContext schoolContext) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public User registerUser(User user) {
        // Never trust a client-supplied id on create (H7): a forged id could overwrite
        // an unrelated existing user's institution/roles/password hash.
        user.setId(null);

        // Medium: none of these were checked before hitting the DB. A blank/missing
        // passwordHash used to NPE inside passwordEncoder.encode(...) (raw 500 instead of
        // a 400); a blank/missing firstName/lastName/email used to fall all the way
        // through to a DataIntegrityViolationException (mapped to a misleading 409
        // "constraint violation" instead of a 400 naming the actual missing field).
        if (user.getFirstName() == null || user.getFirstName().isBlank()) {
            throw new IllegalArgumentException("firstName is required");
        }
        if (user.getLastName() == null || user.getLastName().isBlank()) {
            throw new IllegalArgumentException("lastName is required");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new IllegalArgumentException("password is required");
        }

        if (user.getInstitution() == null || user.getInstitution().getInstitutionId() == null) {
            throw new IllegalArgumentException(
                    "Registration failed: 'institution.institutionId' is missing or null in the request body."
            );
        }

        Integer instId = user.getInstitution().getInstitutionId();

        Institution managedInstitution =
                entityManager.getReference(Institution.class, instId);

        user.setInstitution(managedInstitution);
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        // Medium: AuthService's self-registration path normalizes email to lowercase
        // before saving, but this admin-facing path didn't. Without this, "Foo@x.com" and
        // "foo@x.com" both pass the DB's case-sensitive unique constraint as distinct
        // rows, and findByEmailIgnoreCase-based login/duplicate-checks would silently
        // treat them as two different accounts.
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().trim().toLowerCase());
        }

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role studentRole = roleRepository.findByName("STUDENT")
                    .orElseGet(() -> roleRepository.save(new Role("STUDENT")));
            Set<Role> roles = new HashSet<>();
            roles.add(studentRole);
            user.setRoles(roles);
        }

        return userRepository.save(user);
    }

    /** Staff sees only their own school's users; PLATFORM_SUPER_ADMIN sees everyone. */
    public List<User> getAllUsers() {
        if (schoolContext.isPlatformSuperAdmin()) {
            return userRepository.findAll();
        }
        return userRepository.findByInstitutionInstitutionId(schoolContext.requireSchoolId());
    }

    /**
     * Self-or-staff: a user may always fetch their own record (the mobile profile screen
     * relies on this); staff may fetch any user WITHIN their own school. Cross-school
     * lookups are hidden as 404, not revealed via 403 - matches this codebase's existing
     * convention (see SchoolContext.assertSameSchool).
     */
    public java.util.Optional<User> getUserById(Integer id) {
        var caller = schoolContext.currentUser();
        boolean isSelf = caller.map(c -> c.userId().equals(id)).orElse(false);
        boolean isStaff = caller.map(this::isStaffRole).orElse(false);
        if (!isSelf && !isStaff) {
            throw new IllegalArgumentException("Resource not found.");
        }

        java.util.Optional<User> user = userRepository.findById(id);
        if (isStaff) {
            user.ifPresent(u -> {
                Integer userSchoolId = u.getInstitution() != null ? u.getInstitution().getInstitutionId() : null;
                schoolContext.assertSameSchool(userSchoolId);
            });
        }
        return user;
    }

    /**
     * Staff-only lookup by student number - the librarian-facing alternative to the raw
     * numeric id, since librarians know a student's student number, not their internal
     * user id (used by CirculationScan/FinesLookup on the Web portal).
     */
    public User getUserByStudentId(String studentId) {
        User user = userRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("No student found with that student ID."));
        Integer userSchoolId = user.getInstitution() != null ? user.getInstitution().getInstitutionId() : null;
        schoolContext.assertSameSchool(userSchoolId);
        return user;
    }

    private boolean isStaffRole(com.codequest.libralink.security.AuthenticatedUser user) {
        if (user.roles() == null) {
            return false;
        }
        return user.roles().contains("LIBRARIAN") || user.roles().contains("ADMIN")
                || user.roles().contains("SCHOOL_ADMIN") || user.roles().contains("PLATFORM_SUPER_ADMIN");
    }

    /**
     * Self-service profile update. Only the display fields a user may safely change are
     * touched — email (login identity), roles, password and institution are deliberately
     * not editable here. Null/blank values leave the existing value untouched, so a
     * student ID / index number can be set or overwritten but not cleared to blank here.
     */
    @Transactional
    public User updateProfile(Integer userId, String firstName, String lastName, String phoneNumber,
                             String studentId, String indexNumber, String programme) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName.trim());
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName.trim());
        }
        if (phoneNumber != null) {
            user.setPhoneNumber(phoneNumber.trim());
        }
        if (studentId != null && !studentId.isBlank()) {
            String trimmed = studentId.trim();
            if (!trimmed.matches("\\d{8}")) {
                throw new IllegalArgumentException("Student ID must be 8 digits.");
            }
            userRepository.findByStudentId(trimmed).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new IllegalArgumentException("This student ID is already in use.");
                }
            });
            user.setStudentId(trimmed);
        }
        if (indexNumber != null && !indexNumber.isBlank()) {
            String trimmed = indexNumber.trim();
            if (!trimmed.matches("\\d{7}")) {
                throw new IllegalArgumentException("Index number must be 7 digits.");
            }
            user.setIndexNumber(trimmed);
        }
        if (programme != null) {
            user.setProgramme(programme.trim());
        }
        return userRepository.save(user);
    }

    @Transactional
    public void updatePushToken(Integer userId, String pushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setPushToken(pushToken);
        userRepository.save(user);
    }
}