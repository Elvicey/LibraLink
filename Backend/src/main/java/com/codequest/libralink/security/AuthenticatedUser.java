package com.codequest.libralink.security;

import java.util.List;

/**
 * The Spring Security {@code Authentication} principal set by {@link JwtAuthenticationFilter}.
 * Replaces the previous raw userId String principal so schoolId (and roles) are available
 * per-request without re-decoding the JWT - see {@link SchoolContext}.
 */
public record AuthenticatedUser(Integer userId, String email, Integer schoolId, List<String> roles) {
}
