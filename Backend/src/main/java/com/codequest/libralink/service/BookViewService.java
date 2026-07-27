package com.codequest.libralink.service;

import com.codequest.libralink.entity.BookView;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.BookViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BookViewService {
    @Autowired private BookViewRepository bookViewRepository;
    @Autowired private BookRepository bookRepository;

    public BookView recordView(BookView view) {
        if (view.getBook() != null) {
            Integer schoolId = view.getBook().getInstitution() != null
                    ? view.getBook().getInstitution().getInstitutionId()
                    : bookRepository.findById(view.getBook().getId())
                            .map(b -> b.getInstitution() != null ? b.getInstitution().getInstitutionId() : null)
                            .orElse(null);
            view.setSchoolId(schoolId);
        }
        return bookViewRepository.save(view);
    }
}