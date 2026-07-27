package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// JpaSpecificationExecutor backs NlSearchService's multi-word fallback (Medium: N+1) -
// it used to run one searchByQuery(word) round trip per word in a loop instead of a
// single query.
@Repository
public interface BookRepository extends JpaRepository<Book, Integer>, JpaSpecificationExecutor<Book> {

    List<Book> findByTitleContainingIgnoreCase(String title);

    /**
     * Fetches the book with a DB-level row lock (SELECT ... FOR UPDATE) held for the
     * remainder of the caller's transaction. Callers that need to read a book's
     * availableCopies and then decide whether to write to it (borrow, reserve, etc.)
     * MUST use this instead of findById, otherwise concurrent requests can both read
     * "available" for the last copy and both proceed (the check-then-write race).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Integer id);

    java.util.Optional<Book> findFirstByTitleIgnoreCase(String title);

    List<Book> findByAuthorsFullNameContainingIgnoreCase(String authorName);

    List<Book> findByCategoryId(Integer categoryId);

    List<Book> findByIsbn(String isbn);

    List<Book> findByIsbn13(String isbn13);

    List<Book> findByAvailableCopiesGreaterThan(Integer count);

    long countByInstitutionInstitutionId(Integer institutionId);

    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.isbn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.isbn13) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.subtitle) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Book> searchByQuery(@Param("query") String query);

    @Query("SELECT b FROM Book b JOIN b.authors a WHERE LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Book> searchByAuthor(@Param("query") String query);

    @Query("SELECT b FROM Book b WHERE " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.isbn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.subtitle) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.isbn13) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "b.availableCopies > 0")
    List<Book> searchAvailableByQuery(@Param("query") String query);
}