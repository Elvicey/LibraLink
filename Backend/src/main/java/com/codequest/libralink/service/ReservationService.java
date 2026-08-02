package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.Reservation;
import com.codequest.libralink.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import java.util.List;

@Service
public class ReservationService {

<<<<<<< HEAD
    private final ReservationRepository reservationRepository;
    private final BookService bookService;
    private final NotificationService notificationService;

    public ReservationService(ReservationRepository reservationRepository,
                              BookService bookService,
                              NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.bookService = bookService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Reservation createReservation(Reservation res) {
        Book book = res.getBook();
        if (book == null) {
            throw new IllegalStateException("Book is required for reservation.");
        }

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
=======
    @Autowired
    private ReservationRepository reservationRepository;

    public Reservation createReservation(Reservation res) {
        return reservationRepository.save(res);
>>>>>>> origin/main
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }
<<<<<<< HEAD

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
=======
}
>>>>>>> origin/main
