package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.Institution;
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

    private boolean isStaffRole(com.codequest.libralink.security.AuthenticatedUser user) {
        if (user.roles() == null) {
            return false;
        }
        return user.roles().contains("LIBRARIAN") || user.roles().contains("ADMIN")
                || user.roles().contains("SCHOOL_ADMIN") || user.roles().contains("PLATFORM_SUPER_ADMIN");
    }

    @Transactional
    public void updatePushToken(Integer userId, String pushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPushToken(pushToken);
        userRepository.save(user);
    }
}