package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.exception.ResourceNotFoundException;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.ReservationRepository;
import com.codequest.libralink.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    public ReservationService(ReservationRepository reservationRepository,
                              BookRepository bookRepository,
                              NotificationService notificationService,
                              CurrentUserProvider currentUserProvider) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public Reservation createReservation(Reservation res) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        res.setId(null);
        if (res.getUserId() == null) {
            throw new IllegalStateException("userId is required for reservation.");
        }
        if (res.getBook() == null || res.getBook().getId() == null) {
            throw new IllegalStateException("Book is required for reservation.");
        }
        // Lock the book row for the rest of this transaction so a concurrent
        // borrow/reservation on the same book can't interleave with this
        // read-then-decide-status check (H4).
        Book book = bookRepository.findByIdForUpdate(res.getBook().getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Book not found with id: " + res.getBook().getId()));
        res.setBook(book);

        if (book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
            res.setStatus("READY");
            res.setReadyAt(LocalDateTime.now());
        } else {
            res.setStatus("PENDING");
        }

        Reservation saved = reservationRepository.save(res);

        if (res.getUserId() != null) {
            Notification notification = new Notification();
            notification.setUserId(res.getUserId());
            notification.setType("RESERVATION");
            notification.setTitle("Reservation Confirmed");
            notification.setMessage("Your reservation for \"" + book.getTitle() + "\" has been placed.");
            notification.setChannel("PUSH");
            notification.setReferenceId(saved.getId());
            notification.setReferenceType("RESERVATION");
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);
            notificationService.createNotification(notification);
        }

        return saved;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Transactional
    public Reservation cancelReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        currentUserProvider.requireSelfOrAnyRole(reservation.getUserId(), "LIBRARIAN", "ADMIN");
        reservation.setStatus("CANCELLED");
        reservation.setCancelledAt(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation updateStatus(Integer id, String status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        reservation.setStatus(status);
        return reservationRepository.save(reservation);
    }
}
