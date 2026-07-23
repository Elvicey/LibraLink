package com.codequest.libralink.repository;

import com.codequest.libralink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);

    // Medium (N+1): ReadingListService used to call findAll() and filter to students in
    // Java just to notify them of a newly-published list - a single targeted query
    // instead of loading the entire users table.
    List<User> findByRoles_NameIgnoreCase(String roleName);
}