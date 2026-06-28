package com.codequest.libralink.controller;

import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.service.FinePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fine-payments")
// Lombok removed: @RequiredArgsConstructor is gone
public class FinePaymentController {

    private final FinePaymentService finePaymentService;

    // Explicit constructor added for dependency injection
    public FinePaymentController(FinePaymentService finePaymentService) {
        this.finePaymentService = finePaymentService;
    }

    @PostMapping
    public ResponseEntity<FinePayment> payFine(@RequestBody FinePayment payment) {
        return ResponseEntity.ok(finePaymentService.processPayment(payment));
    }
}