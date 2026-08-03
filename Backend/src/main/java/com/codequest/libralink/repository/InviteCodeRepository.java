package com.codequest.libralink.repository;

import com.codequest.libralink.entity.InviteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {
    List<InviteCode> findByCodeLookupHash(String codeLookupHash);

    Optional<InviteCode> findFirstBySchool_InstitutionIdAndCodeTypeAndUsedAtIsNullOrderByCreatedAtDesc(
            Integer schoolId, String codeType);

    long countBySchool_InstitutionIdAndCodeTypeAndCreatedAtAfter(
            Integer schoolId, String codeType, LocalDateTime after);
}
