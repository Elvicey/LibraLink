package com.codequest.libralink.controller;

import com.codequest.libralink.entity.BookView;
import com.codequest.libralink.service.BookViewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/book-views")
public class BookViewController {
    @Autowired private BookViewService bookViewService;

    @PostMapping
    public BookView logView(@Valid @RequestBody BookView view) {
        return bookViewService.recordView(view);
    }
}