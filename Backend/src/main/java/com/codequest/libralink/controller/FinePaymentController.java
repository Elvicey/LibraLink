package com.codequest.libralink.controller;

import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.FinePaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fine-payments")
public class FinePaymentController {

    private final FinePaymentService finePaymentService;
    private final CurrentUserProvider currentUserProvider;

    public FinePaymentController(FinePaymentService finePaymentService, CurrentUserProvider currentUserProvider) {
        this.finePaymentService = finePaymentService;
        this.currentUserProvider = currentUserProvider;
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<FinePayment> payFine(@RequestBody FinePayment payment) {
        // A student/lecturer can only ever pay their own fine. A librarian/admin may
        // record an in-person payment on behalf of a specific patron by supplying userId.
        payment.setUserId(currentUserProvider.resolveActingUserId(payment.getUserId(), "LIBRARIAN", "ADMIN"));
        return new ResponseEntity<>(finePaymentService.processPayment(payment), HttpStatus.CREATED);
    }
}