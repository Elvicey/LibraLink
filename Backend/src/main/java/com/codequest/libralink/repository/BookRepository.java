package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {

    List<Book> findByTitleContainingIgnoreCase(String title);

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