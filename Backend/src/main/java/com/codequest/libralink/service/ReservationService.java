package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.ReservationRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookService bookService;
    private final NotificationService notificationService;
    private final SchoolContext schoolContext;

    public ReservationService(ReservationRepository reservationRepository,
                              BookService bookService,
                              NotificationService notificationService,
                              SchoolContext schoolContext) {
        this.reservationRepository = reservationRepository;
        this.bookService = bookService;
        this.notificationService = notificationService;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public Reservation createReservation(Reservation res) {
        if (res.getUserId() == null) {
            throw new IllegalStateException("userId is required for reservation.");
        }
        if (res.getBook() == null || res.getBook().getId() == null) {
            throw new IllegalStateException("Book is required for reservation.");
        }
        Book book = bookService.getBookById(res.getBook().getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Book not found with id: " + res.getBook().getId()));
        res.setBook(book);
        res.setSchoolId(book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null);

        if (bookService.isBookAvailable(book.getId())) {
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

    @Transactional
    public Reservation cancelReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus("CANCELLED");
        reservation.setCancelledAt(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation updateStatus(Integer id, String status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        reservation.setStatus(status);
        return reservationRepository.save(reservation);
    }
}
