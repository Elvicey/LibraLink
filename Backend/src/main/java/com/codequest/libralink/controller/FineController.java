package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.service.FineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
// Lombok removed: @RequiredArgsConstructor is gone
public class FineController {

    private final FineService fineService;

    // Explicit constructor added for dependency injection
    public FineController(FineService fineService) {
        this.fineService = fineService;
    }

    @PostMapping
    public ResponseEntity<Fine> issueFine(@RequestBody Fine fine) {
        return ResponseEntity.ok(fineService.createFine(fine));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Fine>> getUserFines(@PathVariable Integer userId) {
        return ResponseEntity.ok(fineService.getFinesByUser(userId));
    }
}