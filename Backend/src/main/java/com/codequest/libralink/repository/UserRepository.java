package com.codequest.libralink.repository;

import com.codequest.libralink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByInstitutionInstitutionId(Integer institutionId);
    long countByInstitutionInstitutionId(Integer institutionId);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r " +
           "WHERE u.institution.institutionId = :schoolId AND r.name = :roleName")
    long countByInstitutionAndRole(@Param("schoolId") Integer schoolId, @Param("roleName") String roleName);
}