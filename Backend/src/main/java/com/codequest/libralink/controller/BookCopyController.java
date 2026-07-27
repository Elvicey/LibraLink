package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookCopy;
import com.codequest.libralink.service.BookCopyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.Roles;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book-copies")
public class BookCopyController {

    @Autowired
    private BookCopyService bookCopyService;

    @PreAuthorize(Roles.STAFF)
    @PostMapping
    public BookCopy createCopy(@RequestBody BookCopy copy) {
        return bookCopyService.registerBookCopy(copy);
    }

    @PreAuthorize(Roles.STAFF)
    @GetMapping
    public List<BookCopy> getAllCopies() {
        return bookCopyService.getAllCopies();
    }

    @PreAuthorize(Roles.STAFF)
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<BookCopy> getCopyByBarcode(@PathVariable String barcode) {
        return bookCopyService.getCopyByBarcode(barcode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}