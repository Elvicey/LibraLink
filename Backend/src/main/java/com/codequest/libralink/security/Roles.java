package com.codequest.libralink.security;

/**
 * Named {@code @PreAuthorize} SpEL constants. Introduced because ~26 identical
 * {@code hasAnyRole('LIBRARIAN','ADMIN')} literals were being touched anyway to add
 * {@code SCHOOL_ADMIN} for the multi-tenant retrofit - a plain string constant is a
 * mechanical, zero-risk substitution (same runtime semantics as the literal it replaces).
 */
public final class Roles {

    private Roles() {}

    /**
     * Ordinary staff reach - librarians and (school-)admins. Includes PLATFORM_SUPER_ADMIN
     * too: a platform admin should have at least staff-level reach everywhere a School
     * Admin does (the school-scoping bypass for platform admins happens at the service
     * layer, via SchoolContext.isPlatformSuperAdmin() - this annotation only gates role,
     * not which school's data comes back).
     */
    public static final String STAFF = "hasAnyRole('LIBRARIAN','ADMIN','SCHOOL_ADMIN','PLATFORM_SUPER_ADMIN')";

    /** Platform-wide reach - not school-scoped. */
    public static final String PLATFORM_ADMIN_ONLY = "hasRole('PLATFORM_SUPER_ADMIN')";

    /**
     * School-admin-and-above only - deliberately excludes LIBRARIAN. Used for the two new
     * staff-invite endpoints (OTP co-admin invite, librarian_code issuance): a Librarian
     * must not be able to invite a co-School-Admin or mint librarian codes for others.
     */
    public static final String SCHOOL_ADMIN_ONLY = "hasAnyRole('ADMIN','SCHOOL_ADMIN','PLATFORM_SUPER_ADMIN')";
}
