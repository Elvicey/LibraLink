package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookView;
import com.codequest.libralink.service.BookViewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/book-views")
public class BookViewController {
    @Autowired private BookViewService bookViewService;

    @PostMapping
    public ResponseEntity<BookView> logView(@Valid @RequestBody BookView view) {
        return new ResponseEntity<>(bookViewService.recordView(view), HttpStatus.CREATED);
    }
}