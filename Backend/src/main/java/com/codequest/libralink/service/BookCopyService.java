package com.codequest.libralink.service;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.repository.BookCopyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BookCopyService {

    @Autowired
    private BookCopyRepository bookCopyRepository;

    public BookCopy registerBookCopy(BookCopy copy) {
        if (copy.getBarcode() != null && !copy.getBarcode().isBlank()) {
            Optional<BookCopy> existing = bookCopyRepository.findByBarcode(copy.getBarcode());
            if (existing.isPresent()
                    && (copy.getId() == null || !existing.get().getId().equals(copy.getId()))) {
                throw new IllegalArgumentException(
                        "A book copy with barcode '" + copy.getBarcode() + "' already exists.");
            }
        }
        return bookCopyRepository.save(copy);
    }

    public List<BookCopy> getAllCopies() {
        return bookCopyRepository.findAll();
    }

    public Optional<BookCopy> getCopyByBarcode(String barcode) {
        return bookCopyRepository.findByBarcode(barcode);
    }
}