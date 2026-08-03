package com.codequest.libralink.service;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.repository.BookCopyRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BookCopyService {

    @Autowired
    private BookCopyRepository bookCopyRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private SchoolContext schoolContext;

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
        if (copy.getSchoolId() == null && copy.getBook() != null) {
            // A client-supplied Book sub-object may only carry an id - resolve the real
            // row rather than trusting a partial deserialized object.
            Integer schoolId = copy.getBook().getInstitution() != null
                    ? copy.getBook().getInstitution().getInstitutionId()
                    : bookRepository.findById(copy.getBook().getId())
                            .map(b -> b.getInstitution() != null ? b.getInstitution().getInstitutionId() : null)
                            .orElse(null);
            copy.setSchoolId(schoolId);
        }
        return bookCopyRepository.save(copy);
    }

    public List<BookCopy> getAllCopies() {
        List<BookCopy> copies = bookCopyRepository.findAll();
        if (schoolContext.isPlatformSuperAdmin()) {
            return copies;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return copies.stream().filter(c -> schoolId.equals(c.getSchoolId())).toList();
    }

    public Optional<BookCopy> getCopyByBarcode(String barcode) {
        Optional<BookCopy> copy = bookCopyRepository.findByBarcode(barcode);
        copy.ifPresent(c -> schoolContext.assertSameSchool(c.getSchoolId()));
        return copy;
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