package com.codequest.libralink.repository;

import com.codequest.libralink.entity.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Integer> {

    // Crucial for scanning barcodes on physical collection/return desks
    Optional<BookCopy> findByBarcode(String barcode);
}