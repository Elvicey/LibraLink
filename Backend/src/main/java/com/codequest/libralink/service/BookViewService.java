package com.codequest.libralink.service;

import com.codequest.libralink.entity.BookView;
import com.codequest.libralink.repository.BookViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BookViewService {
    @Autowired private BookViewRepository bookViewRepository;

    public BookView recordView(BookView view) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        view.setId(null);
        return bookViewRepository.save(view);
    }
}