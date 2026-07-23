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

    // NOTE: this method is shared between BookCopyController's create endpoint and
    // CirculationController's check-in/check-out flow (which legitimately updates an
    // existing copy's isAvailable flag), so it cannot blindly null the id here - the
    // create-only caller is responsible for that (see BookCopyController.createCopy).
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

    /**
     * Flips a single copy's availability flag. Used by the circulation check-in/check-out
     * flow (see BorrowRecordService.checkOutCopy/checkInCopy) instead of having callers
     * mutate the entity and call the create-oriented registerBookCopy directly.
     */
    public BookCopy setAvailability(BookCopy copy, boolean available) {
        copy.setAvailable(available);
        return bookCopyRepository.save(copy);
    }
}