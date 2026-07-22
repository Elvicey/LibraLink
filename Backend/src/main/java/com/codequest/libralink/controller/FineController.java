package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.service.FineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    private final FineService fineService;

    public FineController(FineService fineService) {
        this.fineService = fineService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<Fine> issueFine(@RequestBody Fine fine) {
        return ResponseEntity.ok(fineService.createFine(fine));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Fine>> getUserFines(@PathVariable Integer userId) {
        return ResponseEntity.ok(fineService.getFinesByUser(userId));
    }
}