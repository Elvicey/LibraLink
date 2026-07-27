package com.codequest.libralink;

import com.codequest.libralink.entity.AudioTrack;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.AudioTrackRepository;
import com.codequest.libralink.repository.BookRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for the Group 8 remediation (Medium: wrong status codes, fragile
 * global error handling):
 * - Create endpoints now return 201 Created instead of 200 OK.
 * - "Delete a resource" endpoints now return 204 No Content with no body instead of
 *   200 + a {"message": "..."} body.
 * - Services that used to throw a plain RuntimeException for "not found" (which
 *   GlobalExceptionHandler had no handler for, so it fell through to an unhandled 500)
 *   now throw ResourceNotFoundException and correctly return 404.
 */
class Group8ApiCorrectnessTest extends BaseApiTest {

    @Autowired
    private AudioTrackRepository audioTrackRepository;

    @Autowired
    private BookRepository bookRepository;

    // --- Delete endpoints: 204 No Content, no body ---

    @Test
    void deleteAudioTrack_returns204() throws Exception {
        User student = createTestStudent(uniqueEmail("g8audio"), "pass1234");
        String studentToken = loginAs(student.getEmail(), "pass1234");

        Book book = new Book();
        book.setTitle("Audio Track Source Book");
        book.setIsbn("978-8-" + (int) (Math.random() * 900000000 + 100000000) + "-3");
        book.setTotalCopies(1);
        book.setAvailableCopies(1);
        book.setActive(true);
        book = bookRepository.save(book);

        AudioTrack track = new AudioTrack();
        track.setBookId(book.getId());
        track.setUserId(student.getId());
        track.setTitle("My Track");
        track.setStatus("COMPLETED");
        track = audioTrackRepository.save(track);

        mockMvc.perform(delete("/api/audio/" + track.getId())
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        org.junit.jupiter.api.Assertions.assertTrue(
                audioTrackRepository.findById(track.getId()).isEmpty());
    }

    // --- Not-found paths that used to throw a plain RuntimeException (unhandled 500) ---

    @Test
    void addBooksToNonExistentCourse_returns404NotServerError() throws Exception {
        String token = createAndGetLibrarianToken(uniqueEmail("g8course"), "pass1234");

        mockMvc.perform(put("/api/courses/999999/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(token))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("bookIds", java.util.List.of()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void cancelNonExistentReservation_returns404NotServerError() throws Exception {
        String token = createAndGetLibrarianToken(uniqueEmail("g8resv"), "pass1234");

        mockMvc.perform(put("/api/reservations/999999/cancel")
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void submitAnswerForNonExistentQuestion_returns404NotServerError() throws Exception {
        User student = createTestStudent(uniqueEmail("g8exam"), "pass1234");
        String studentToken = loginAs(student.getEmail(), "pass1234");

        mockMvc.perform(post("/api/exam/questions/999999/answer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(studentToken))
                        .content(objectMapper.writeValueAsString(java.util.Map.of("answer", "A"))))
                .andExpect(status().isNotFound());
    }
}
