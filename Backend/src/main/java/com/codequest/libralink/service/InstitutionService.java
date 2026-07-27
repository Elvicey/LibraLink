package com.codequest.libralink.service;

import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.InstitutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class InstitutionService {

    @Autowired
    private InstitutionRepository institutionRepository;

    public Institution createInstitution(Institution institution) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        institution.setInstitutionId(null);
        return institutionRepository.save(institution);
    }

    public List<Institution> getAllInstitutions() {
        return institutionRepository.findAll();
    }
}