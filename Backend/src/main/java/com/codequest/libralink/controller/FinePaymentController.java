package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Fine;
import com.codequest.libralink.entity.FinePayment;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.FinePaymentRepository;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.FinePaymentService;
import com.codequest.libralink.service.FineService;
import com.codequest.libralink.service.PaymentGatewayService;
import com.codequest.libralink.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/fine-payments")
public class FinePaymentController {

    private final FinePaymentService finePaymentService;
    private final CurrentUserProvider currentUserProvider;
    private final PaymentGatewayService paymentGatewayService;
    private final FineService fineService;
    private final UserService userService;
    private final FinePaymentRepository finePaymentRepository;

    public FinePaymentController(FinePaymentService finePaymentService,
                                 CurrentUserProvider currentUserProvider,
                                 PaymentGatewayService paymentGatewayService,
                                 FineService fineService,
                                 UserService userService,
                                 FinePaymentRepository finePaymentRepository) {
        this.finePaymentService = finePaymentService;
        this.currentUserProvider = currentUserProvider;
        this.paymentGatewayService = paymentGatewayService;
        this.fineService = fineService;
        this.userService = userService;
        this.finePaymentRepository = finePaymentRepository;
    }

    // STUDENT deliberately excluded (see below) - this marks a fine PAID with no gateway
    // charge, so a student could settle their own fine for free if allowed to call it.
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SCHOOL_ADMIN')")
    @PostMapping
    public ResponseEntity<FinePayment> payFine(@RequestBody FinePayment payment) {
        // Staff-only: records an in-person (e.g. cash) payment against a patron's fine and
        // marks it PAID WITHOUT a gateway charge. Students must never reach this — otherwise
        // they could settle their own fines for free, bypassing Paystack. Self-service online
        // payment goes through /initialize + /verify, which only marks a fine paid after
        // Paystack confirms the money server-side.
        payment.setUserId(currentUserProvider.resolveActingUserId(payment.getUserId(), "LIBRARIAN", "ADMIN"));
        return new ResponseEntity<>(finePaymentService.processPayment(payment), HttpStatus.CREATED);
    }

    /**
     * Start a real Paystack checkout for a single fine. Returns the hosted-checkout URL
     * (opened in the app's browser) and the reference used to verify the outcome. Nothing
     * is written to fine_payments here — the fine is only marked paid once verify confirms
     * Paystack reports "success".
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'LIBRARIAN', 'ADMIN')")
    @PostMapping("/initialize")
    public ResponseEntity<?> initialize(@RequestBody Map<String, Object> body) {
        if (!paymentGatewayService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Online payments are not available right now."));
        }
        Integer fineId = toInt(body.get("fineId"));
        if (fineId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "fineId is required"));
        }

        Fine fine = fineService.getFineById(fineId);
        // The signed-in student must own the fine (staff may act on a patron's behalf).
        currentUserProvider.requireSelfOrAnyRole(fine.getUserId(), "LIBRARIAN", "ADMIN");
        if ("PAID".equalsIgnoreCase(fine.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This fine is already paid."));
        }
        if (fine.getAmount() == null || fine.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "This fine has no amount due."));
        }

        User owner = userService.getUserById(fine.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Fine owner not found."));
        if (owner.getEmail() == null || owner.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A valid email is required to pay online."));
        }

        // Unique per attempt; also carries the fine id for easy reconciliation in the dashboard.
        String reference = "LIB-" + fineId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Optional app deep link Paystack redirects to after checkout (see openAuthSessionAsync
        // on the client). Falls back to the browser-close flow when absent.
        String callbackUrl = body.get("callbackUrl") == null ? null : body.get("callbackUrl").toString();

        PaymentGatewayService.InitResult init = paymentGatewayService.initialize(
                owner.getEmail(), fine.getAmount(), reference, fineId, fine.getUserId(), callbackUrl);

        return ResponseEntity.ok(Map.of(
                "authorizationUrl", init.authorizationUrl(),
                "reference", init.reference(),
                "publicKey", paymentGatewayService.getPublicKey() == null ? "" : paymentGatewayService.getPublicKey()));
    }

    /**
     * Verify a Paystack transaction and, only if it succeeded, record the payment and mark
     * the fine paid. Idempotent: re-verifying an already-settled reference returns the
     * existing outcome instead of double-paying.
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'LIBRARIAN', 'ADMIN')")
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        if (!paymentGatewayService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Online payments are not available right now."));
        }
        String reference = body.get("reference") == null ? null : body.get("reference").toString();
        if (reference == null || reference.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "reference is required"));
        }

        // Already settled? Return success without touching Paystack again.
        if (finePaymentRepository.findByTransactionRef(reference).isPresent()) {
            return ResponseEntity.ok(Map.of("paid", true, "status", "success",
                    "message", "Payment already recorded."));
        }

        PaymentGatewayService.VerifyResult result = paymentGatewayService.verify(reference);
        if (!result.success()) {
            return ResponseEntity.ok(Map.of("paid", false,
                    "status", result.gatewayStatus() == null ? "unknown" : result.gatewayStatus(),
                    "message", "Payment not completed."));
        }
        if (result.fineId() == null || result.userId() == null) {
            return ResponseEntity.badRequest().body(Map.of("paid", false, "status", "error",
                    "message", "Payment could not be matched to a fine."));
        }

        // Only the fine's owner (or staff) may settle it.
        currentUserProvider.requireSelfOrAnyRole(result.userId(), "LIBRARIAN", "ADMIN");

        FinePayment payment = new FinePayment();
        payment.setFineId(result.fineId());
        payment.setUserId(result.userId());
        payment.setAmountPaid(BigDecimal.valueOf(result.amountMinor()).movePointLeft(2)); // pesewas -> GHS
        payment.setPaymentMethod("PAYSTACK");
        payment.setTransactionRef(reference);
        payment.setPaidAt(LocalDateTime.now());
        finePaymentService.processPayment(payment);

        return ResponseEntity.ok(Map.of("paid", true, "status", "success",
                "message", "Payment successful."));
    }

    private static Integer toInt(Object o) {
        if (o instanceof Number n) {
            return n.intValue();
        }
        try {
            return o == null ? null : Integer.valueOf(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
