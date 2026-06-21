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
        return bookCopyRepository.save(copy);
    }

    public List<BookCopy> getAllCopies() {
        return bookCopyRepository.findAll();
    }

    public Optional<BookCopy> getCopyByBarcode(String barcode) {
        return bookCopyRepository.findByBarcode(barcode);
    }
}