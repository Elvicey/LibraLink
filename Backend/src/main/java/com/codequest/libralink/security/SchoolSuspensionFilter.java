package com.codequest.libralink.security;

import com.codequest.libralink.repository.InstitutionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Rejects requests from an authenticated, school-scoped user whose school has been
 * suspended. Runs after {@link JwtAuthenticationFilter} in the chain (see SecurityConfig),
 * so the {@link AuthenticatedUser} principal is already set. PLATFORM_SUPER_ADMIN and
 * unauthenticated requests both carry no schoolId ({@link SchoolContext#currentSchoolId()}
 * returns null for both) and are never affected by this check.
 */
@Component
public class SchoolSuspensionFilter extends OncePerRequestFilter {

    private final SchoolContext schoolContext;
    private final InstitutionRepository institutionRepository;

    public SchoolSuspensionFilter(SchoolContext schoolContext, InstitutionRepository institutionRepository) {
        this.schoolContext = schoolContext;
        this.institutionRepository = institutionRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Integer schoolId = schoolContext.currentSchoolId();
        if (schoolId != null) {
            boolean suspended = institutionRepository.findById(schoolId)
                    .map(school -> "SUSPENDED".equals(school.getStatus()))
                    .orElse(false);
            if (suspended) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.getWriter().write(
                        "{\"error\":\"Forbidden\",\"message\":\"This school has been suspended.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
