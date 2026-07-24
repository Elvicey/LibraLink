package com.codequest.libralink.repository;

import com.codequest.libralink.entity.BorrowRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Integer> {
    List<BorrowRecord> findByUserId(Integer userId);

    List<BorrowRecord> findByStatus(String status);

    // Medium (N+1): OverdueBookScheduler processes each of these one at a time (each in
    // its own short transaction, deliberately, so one hung push call/bad record can't
    // block the whole batch - see the scheduler's comment). Since BorrowRecord.user/book
    // are now lazy (Group 6, H10), accessing them per record would otherwise mean one
    // lazy-load query per record on top of that per-record transaction. Fetch both
    // up front in the single initial query instead.
    @Query("SELECT br FROM BorrowRecord br " +
           "LEFT JOIN FETCH br.user LEFT JOIN FETCH br.book " +
           "WHERE br.status = :status AND br.dueDate < :date")
    List<BorrowRecord> findByStatusAndDueDateBeforeFetchUserAndBook(
            @Param("status") String status, @Param("date") LocalDate date);

    /** Ids of still-out loans whose due date has passed — the daily overdue/fine-accrual job. */
    @Query("SELECT br.id FROM BorrowRecord br WHERE br.status IN :statuses AND br.dueDate < :date")
    List<Integer> findOverdueUnreturnedIds(@Param("statuses") List<String> statuses,
                                           @Param("date") LocalDate date);

    List<BorrowRecord> findByUserIdAndStatus(Integer userId, String status);

    List<BorrowRecord> findByUserIdAndStatusIn(Integer userId, List<String> statuses);

    Optional<BorrowRecord> findFirstByBookCopyIdAndStatus(Integer bookCopyId, String status);
}