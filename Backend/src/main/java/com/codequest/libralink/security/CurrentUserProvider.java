package com.codequest.libralink.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Single source of truth for reading the authenticated user's identity out of the
 * SecurityContext (populated by {@link JwtAuthenticationFilter}) and for enforcing
 * "is this my own resource, or am I staff" ownership checks.
 * <p>
 * Controllers/services MUST use this instead of trusting a client-supplied
 * userId/studentId directly. Bean name "currentUserProvider" is referenced from
 * {@code @PreAuthorize} SpEL expressions, e.g.
 * {@code @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN','ADMIN')")}.
 */
@Component("currentUserProvider")
public class CurrentUserProvider {

    public Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }
        try {
            return Integer.valueOf(auth.getPrincipal().toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public boolean isCurrentUser(Integer userId) {
        Integer currentId = getCurrentUserId();
        return currentId != null && currentId.equals(userId);
    }

    public boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            for (String role : roles) {
                if (authority.getAuthority().equals("ROLE_" + role)) {
                    return true;
                }
            }
        }
        return false;
    }

    /** Used from {@code @PreAuthorize} to gate a "get/update my own X" endpoint. */
    public boolean isSelfOrHasAnyRole(Integer userId, String... staffRoles) {
        return isCurrentUser(userId) || hasAnyRole(staffRoles);
    }

    /** Throws (translated to HTTP 403 by Spring Security) unless the caller owns userId or holds one of staffRoles. */
    public void requireSelfOrAnyRole(Integer userId, String... staffRoles) {
        if (!isSelfOrHasAnyRole(userId, staffRoles)) {
            throw new AccessDeniedException("You do not have permission to access this resource.");
        }
    }

    /**
     * Resolves who a "create on behalf of" action should be attributed to: staff may
     * explicitly target another user (e.g. a librarian recording an in-person fine
     * payment for a patron); everyone else always acts as themselves, regardless of
     * what userId they submitted in the request body.
     */
    public Integer resolveActingUserId(Integer requestedUserId, String... staffRoles) {
        if (requestedUserId != null && hasAnyRole(staffRoles)) {
            return requestedUserId;
        }
        return getCurrentUserId();
    }
}
