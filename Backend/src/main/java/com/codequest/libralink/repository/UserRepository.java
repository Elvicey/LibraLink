package com.codequest.libralink.repository;

import com.codequest.libralink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // You can add custom finder methods here if needed, like:
    // Optional<User> findByEmail(String email);
}