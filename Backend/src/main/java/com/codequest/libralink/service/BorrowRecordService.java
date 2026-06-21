package com.codequest.libralink.service;

import com.codequest.libralink.entity.BorrowRecord;
import com.codequest.libralink.repository.BorrowRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BorrowRecordService {
    @Autowired private BorrowRecordRepository borrowRecordRepository;
    public BorrowRecord saveRecord(BorrowRecord rec) { return borrowRecordRepository.save(rec); }
}