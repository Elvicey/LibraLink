package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.exception.ResourceNotFoundException;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.ReservationRepository;
import com.codequest.libralink.security.SchoolContext;
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
    private final SchoolContext schoolContext;
    private final CurrentUserProvider currentUserProvider;

    public ReservationService(ReservationRepository reservationRepository,
                              BookRepository bookRepository,
                              NotificationService notificationService,
                              SchoolContext schoolContext,
                              CurrentUserProvider currentUserProvider) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.schoolContext = schoolContext;
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
        res.setSchoolId(book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null);

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
            notification.setSchoolId(res.getSchoolId());
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

    /** Staff sees only their own school's reservations; PLATFORM_SUPER_ADMIN sees everyone. */
    public List<Reservation> getAllReservations() {
        if (schoolContext.isPlatformSuperAdmin()) {
            return reservationRepository.findAll();
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return reservationRepository.findAll().stream()
                .filter(r -> schoolId.equals(r.getSchoolId()))
                .toList();
    }

    /**
     * A single patron's reservations, newest first, scoped to the caller's own school
     * (PLATFORM_SUPER_ADMIN sees all). Book is EAGER, so titles come along.
     */
    @Transactional(readOnly = true)
    public List<Reservation> getReservationsForUser(Integer userId) {
        List<Reservation> reservations = reservationRepository.findByUserIdOrderByReservedAtDesc(userId);
        if (schoolContext.isPlatformSuperAdmin()) {
            return reservations;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return reservations.stream().filter(r -> schoolId.equals(r.getSchoolId())).toList();
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
