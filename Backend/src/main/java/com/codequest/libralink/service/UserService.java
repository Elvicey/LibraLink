package com.codequest.libralink.service;

import com.codequest.libralink.entity.Role;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.RoleRepository;
import com.codequest.libralink.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< HEAD
import java.util.HashSet;
import java.util.List;
import java.util.Set;
=======
import java.util.List;
>>>>>>> origin/main

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
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

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role studentRole = roleRepository.findByName("STUDENT")
                    .orElseGet(() -> roleRepository.save(new Role("STUDENT")));
            Set<Role> roles = new HashSet<>();
            roles.add(studentRole);
            user.setRoles(roles);
        }

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
<<<<<<< HEAD

    public java.util.Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    @Transactional
    public void updatePushToken(Integer userId, String pushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPushToken(pushToken);
        userRepository.save(user);
    }
=======
>>>>>>> origin/main
}