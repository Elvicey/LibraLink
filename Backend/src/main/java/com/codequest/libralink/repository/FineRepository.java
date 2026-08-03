package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Fine;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Integer> {
    List<Fine> findByUserId(Integer userId);
    List<Fine> findByStatus(String status);
    List<Fine> findByBorrowId(Integer borrowId);

    /**
     * Fetches the fine with a DB-level row lock (SELECT ... FOR UPDATE) held for the
     * remainder of the caller's transaction, so two concurrent payment attempts on the
     * same fine can't both read "not yet paid" and both succeed (double payment).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Fine f where f.id = :id")
    Optional<Fine> findByIdForUpdate(@Param("id") Integer id);
}