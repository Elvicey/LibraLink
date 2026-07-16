package com.codequest.libralink.service;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(User user) {

        if (user.getInstitution() == null || user.getInstitution().getInstitutionId() == null) {
            throw new IllegalArgumentException(
                    "Registration failed: 'institution.institutionId' is missing or null in the request body."
            );
        }

        Integer instId = user.getInstitution().getInstitutionId();

        Institution managedInstitution =
                entityManager.getReference(Institution.class, instId);

        user.setInstitution(managedInstitution);
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public java.util.Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }
}