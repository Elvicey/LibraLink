package com.codequest.libralink.service;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User registerUser(User user) {
        // Validation check preventing the "Identifier may not be null" crash
        if (user.getInstitution() == null || user.getInstitution().getInstitutionId() == null) {
            throw new IllegalArgumentException("Registration failed: 'institution.institutionId' is missing or null in the request body.");
        }

        Integer instId = user.getInstitution().getInstitutionId();

        // Safely fetch reference now that we know instId is definitely not null
        Institution managedInstitution = entityManager.getReference(Institution.class, instId);
        user.setInstitution(managedInstitution);

        return userRepository.save(user);
    }
}