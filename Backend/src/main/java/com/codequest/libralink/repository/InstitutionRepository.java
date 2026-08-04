package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Integer> {
    Optional<Institution> findByShortName(String shortName);
}