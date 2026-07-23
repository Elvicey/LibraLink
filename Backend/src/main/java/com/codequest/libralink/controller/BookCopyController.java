package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.service.BookCopyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book-copies")
public class BookCopyController {

    @Autowired
    private BookCopyService bookCopyService;

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public BookCopy createCopy(@Valid @RequestBody BookCopy copy) {
        // Never trust a client-supplied id on create (H7): registerBookCopy is shared
        // with the check-in/check-out update flow, so the reset must happen here.
        copy.setId(null);
        return bookCopyService.registerBookCopy(copy);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping
    public List<BookCopy> getAllCopies() {
        return bookCopyService.getAllCopies();
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<BookCopy> getCopyByBarcode(@PathVariable String barcode) {
        return bookCopyService.getCopyByBarcode(barcode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}