package com.codequest.libralink.controller;

import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.service.FinePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fine-payments")
public class FinePaymentController {

    private final FinePaymentService finePaymentService;

    public FinePaymentController(FinePaymentService finePaymentService) {
        this.finePaymentService = finePaymentService;
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<FinePayment> payFine(@RequestBody FinePayment payment) {
        return ResponseEntity.ok(finePaymentService.processPayment(payment));
    }
}