package com.codequest.libralink.service;

import com.codequest.libralink.dto.CreateSchoolRequest;
import com.codequest.libralink.dto.SchoolCodeResponse;
import com.codequest.libralink.dto.SchoolResponse;
import com.codequest.libralink.dto.UpdateSchoolRequest;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.InviteCode;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.InviteCodeRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.SchoolContext;
import com.codequest.libralink.util.CodeGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Platform Super Admin school management: create, list (+ stats), suspend/reactivate,
 *  regenerate school_code. */
@Service
public class SchoolService {

    private final InstitutionRepository institutionRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final InviteCodeService inviteCodeService;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final SchoolContext schoolContext;

    public SchoolService(InstitutionRepository institutionRepository,
                         InviteCodeRepository inviteCodeRepository,
                         InviteCodeService inviteCodeService,
                         UserRepository userRepository,
                         BookRepository bookRepository,
                         SchoolContext schoolContext) {
        this.institutionRepository = institutionRepository;
        this.inviteCodeRepository = inviteCodeRepository;
        this.inviteCodeService = inviteCodeService;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public SchoolCodeResponse createSchool(CreateSchoolRequest request) {
        Institution school = new Institution();
        school.setName(request.getName());
        school.setShortName(request.getShortName());
        school.setCity(request.getCity());
        if (request.getCountry() != null && !request.getCountry().isBlank()) {
            school.setCountry(request.getCountry());
        }
        school.setEmail(request.getEmail());
        school.setPhone(request.getPhone());
        school.setStatus("ACTIVE");
        school = institutionRepository.save(school);

        String rawCode = issueSchoolCode(school);
        return new SchoolCodeResponse(school.getInstitutionId(), school.getName(),
                school.getShortName(), school.getStatus(), rawCode);
    }

    public List<SchoolResponse> listSchools() {
        return institutionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public Object updateSchool(Integer id, UpdateSchoolRequest request) {
        Institution school = institutionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("School not found with id: " + id));

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String status = request.getStatus().trim().toUpperCase();
            if (!status.equals("ACTIVE") && !status.equals("SUSPENDED")) {
                throw new IllegalArgumentException("status must be ACTIVE or SUSPENDED");
            }
            school.setStatus(status);
            school.setSuspendedAt(status.equals("SUSPENDED") ? java.time.LocalDateTime.now() : null);
            institutionRepository.save(school);
        }

        if (Boolean.TRUE.equals(request.getRegenerateCode())) {
            inviteCodeService.invalidateActive(school.getInstitutionId(), InviteCodeService.TYPE_SCHOOL_CODE);
            String rawCode = issueSchoolCode(school);
            return new SchoolCodeResponse(school.getInstitutionId(), school.getName(),
                    school.getShortName(), school.getStatus(), rawCode);
        }

        return toResponse(school);
    }

    private String issueSchoolCode(Institution school) {
        String rawCode = CodeGenerator.generateSchoolCode();
        Integer issuedBy = schoolContext.currentUser().map(u -> u.userId()).orElse(null);
        inviteCodeService.issue(school, InviteCodeService.TYPE_SCHOOL_CODE, "SCHOOL_ADMIN",
                null, issuedBy, null, rawCode);
        return rawCode;
    }

    private SchoolResponse toResponse(Institution school) {
        Integer id = school.getInstitutionId();
        boolean pending = inviteCodeRepository
                .findFirstBySchool_InstitutionIdAndCodeTypeAndUsedAtIsNullOrderByCreatedAtDesc(
                        id, InviteCodeService.TYPE_SCHOOL_CODE)
                .map(InviteCode::isValid)
                .orElse(false);
        long userCount = userRepository.countByInstitutionInstitutionId(id);
        long bookCount = bookRepository.countByInstitutionInstitutionId(id);
        long schoolAdminCount = userRepository.countByInstitutionAndRole(id, "SCHOOL_ADMIN");
        return new SchoolResponse(id, school.getName(), school.getShortName(), school.getStatus(),
                pending, userCount, bookCount, schoolAdminCount);
    }
}
