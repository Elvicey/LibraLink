package com.codequest.libralink.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Single source of truth for "which school is the current request scoped to" - the
 * multi-tenant analog of a per-request current-user helper. Reads the {@link AuthenticatedUser}
 * principal set by {@link JwtAuthenticationFilter}.
 *
 * <p>{@code PLATFORM_SUPER_ADMIN} callers carry no schoolId (not school-scoped, can act
 * across every school); every other role's token always carries one.
 */
@Component
public class SchoolContext {

    public Optional<AuthenticatedUser> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            return Optional.empty();
        }
        return Optional.of(user);
    }

    public boolean isPlatformSuperAdmin() {
        return currentUser()
                .map(u -> u.roles() != null && u.roles().contains("PLATFORM_SUPER_ADMIN"))
                .orElse(false);
    }

    /** Null-safe: null for an unauthenticated caller or a PLATFORM_SUPER_ADMIN. */
    public Integer currentSchoolId() {
        return currentUser().map(AuthenticatedUser::schoolId).orElse(null);
    }

    /** For services that must be school-scoped; throws if the caller has no school. */
    public Integer requireSchoolId() {
        Integer schoolId = currentSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException(
                    "This action requires an authenticated, school-scoped user.");
        }
        return schoolId;
    }

    /**
     * Throws (mapped to 404 by GlobalExceptionHandler's existing "not found" substring
     * match - deliberately consistent with this codebase's convention of hiding
     * cross-tenant resource existence rather than revealing it via 403) if the given
     * resource's school doesn't match the caller's - unless the caller is a
     * PLATFORM_SUPER_ADMIN, who bypasses all school-scoping.
     */
    public void assertSameSchool(Integer resourceSchoolId) {
        if (isPlatformSuperAdmin()) {
            return;
        }
        Integer callerSchoolId = requireSchoolId();
        if (resourceSchoolId == null || !callerSchoolId.equals(resourceSchoolId)) {
            throw new IllegalArgumentException("Resource not found.");
        }
    }

    /**
     * The "act on behalf of" pattern: a School Admin/Librarian always acts within their
     * own school regardless of what a request body asks for; only a PLATFORM_SUPER_ADMIN
     * may explicitly target a different school.
     */
    public Integer resolveTargetSchoolId(Integer requestedSchoolId) {
        if (isPlatformSuperAdmin()) {
            return requestedSchoolId != null ? requestedSchoolId : currentSchoolId();
        }
        return requireSchoolId();
    }
}
