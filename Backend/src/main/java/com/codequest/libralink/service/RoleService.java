package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.SchoolContext;
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
    @Autowired private SchoolContext schoolContext;
    @Autowired private AuditLogService auditLogService;

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
        // Every other lookup-by-id path (UserService.getUserById/getUserByStudentId) scopes
        // a staff caller to their own school via assertSameSchool; this one was missing it,
        // letting any staff role (including a plain LIBRARIAN) grant ADMIN to a user in a
        // school they don't belong to.
        Integer userSchoolId = user.getInstitution() != null ? user.getInstitution().getInstitutionId() : null;
        schoolContext.assertSameSchool(userSchoolId);
        Role role = roleRepository.findByName(normalized)
                .orElseGet(() -> roleRepository.save(new Role(normalized)));
        user.getRoles().add(role);
        User saved = userRepository.save(user);

        // Not logged if the target user has no school (rare - e.g. a PLATFORM_SUPER_ADMIN
        // caller granting a role to another schoolless user; assertSameSchool above already
        // bypasses its own check in that case). schoolId is required on audit_logs.
        if (userSchoolId != null) {
            Integer actorId = schoolContext.currentUser().map(u -> u.userId()).orElse(null);
            auditLogService.log(actorId, userSchoolId, "ROLE_GRANTED", "USER", userId,
                    "Granted role " + normalized);
        }
        return saved;
    }
}