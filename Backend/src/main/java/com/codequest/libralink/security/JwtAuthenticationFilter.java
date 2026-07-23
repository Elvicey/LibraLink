package com.codequest.libralink.security;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT auth filter for the Spring Security chain only.
 * Servlet container registration is disabled in {@link com.codequest.libralink.config.SecurityConfig}
 * so SecurityContextHolderFilter cannot clear authentication set too early.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.validateToken(token)) {
                String userIdStr = jwtUtil.extractUserId(token);

                // H5: previously the JWT's own claims (roles, and the mere fact that it was
                // validly signed) were trusted for the token's full lifetime (up to 24h)
                // with no re-check against the database, so a deactivated/deleted/demoted
                // user kept full access until their old token happened to expire. Re-load
                // the user on every request instead, and derive authorities from their
                // *current* DB roles rather than the roles frozen into the token at login.
                User user = resolveActiveUser(userIdStr);

                if (user != null) {
                    List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userIdStr, user.getEmail(), authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(auth);
                    SecurityContextHolder.setContext(context);
                }
                // else: token is structurally/cryptographically valid but the user no
                // longer exists or has been deactivated - leave the SecurityContext
                // unauthenticated so downstream handling treats this exactly like a
                // missing/invalid token (401 via the configured entry point).
            }
        }

        filterChain.doFilter(request, response);
    }

    private User resolveActiveUser(String userIdStr) {
        if (userIdStr == null) {
            return null;
        }
        try {
            Integer userId = Integer.valueOf(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            return (user != null && user.isActive()) ? user : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
