package com.codequest.libralink.service;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.InviteCodeRepository;
import com.codequest.libralink.security.SchoolContext;
import com.codequest.libralink.util.CodeGenerator;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/** School Admin-facing invite issuance: co-admin OTP invites and librarian_codes. Both are
 *  always scoped to the caller's OWN school (SchoolContext.requireSchoolId()) - a School
 *  Admin cannot invite into or issue a code for a school they don't belong to. */
@Service
public class StaffInviteService {

    /** Max OTP invites a single school may generate per rolling hour. */
    private static final int MAX_OTP_PER_HOUR = 5;

    private final InstitutionRepository institutionRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final InviteCodeService inviteCodeService;
    private final SchoolContext schoolContext;

    public StaffInviteService(InstitutionRepository institutionRepository,
                              InviteCodeRepository inviteCodeRepository,
                              InviteCodeService inviteCodeService,
                              SchoolContext schoolContext) {
        this.institutionRepository = institutionRepository;
        this.inviteCodeRepository = inviteCodeRepository;
        this.inviteCodeService = inviteCodeService;
        this.schoolContext = schoolContext;
    }

    /**
     * No email infrastructure exists in this codebase (no mail starter, no EmailService),
     * so this deliberately returns the OTP directly in the response, clearly marked as a
     * dev/interim behavior - real email delivery is an explicit follow-up, not built here.
     */
    public Map<String, Object> inviteSchoolAdmin(String email) {
        Integer schoolId = schoolContext.requireSchoolId();

        long recentCount = inviteCodeRepository.countBySchool_InstitutionIdAndCodeTypeAndCreatedAtAfter(
                schoolId, InviteCodeService.TYPE_SCHOOL_ADMIN_OTP, LocalDateTime.now().minusHours(1));
        if (recentCount >= MAX_OTP_PER_HOUR) {
            throw new IllegalArgumentException(
                    "Too many invite attempts for this school in the last hour. Try again later.");
        }

        Institution school = institutionRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("School not found with id: " + schoolId));

        String rawOtp = CodeGenerator.generateOtp();
        Integer issuedBy = schoolContext.currentUser().map(u -> u.userId()).orElse(null);
        inviteCodeService.issue(school, InviteCodeService.TYPE_SCHOOL_ADMIN_OTP, "SCHOOL_ADMIN",
                email, issuedBy, LocalDateTime.now().plusMinutes(15), rawOtp);

        return Map.of(
                "email", email,
                "otp", rawOtp,
                "expiresInMinutes", 15,
                "note", "Email delivery not yet implemented - OTP returned directly for now."
        );
    }

    public Map<String, Object> issueLibrarianCode() {
        Integer schoolId = schoolContext.requireSchoolId();
        Institution school = institutionRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("School not found with id: " + schoolId));

        String rawCode = CodeGenerator.generateLibrarianCode();
        Integer issuedBy = schoolContext.currentUser().map(u -> u.userId()).orElse(null);
        inviteCodeService.issue(school, InviteCodeService.TYPE_LIBRARIAN_CODE, "LIBRARIAN",
                null, issuedBy, null, rawCode);

        return Map.of("schoolId", schoolId, "librarianCode", rawCode);
    }
}
