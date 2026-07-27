package com.codequest.libralink;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pickups are only approved Monday–Friday, 09:00–17:00, and the whole (server-derived)
 * window must fit inside those hours. The weekday/hours checks run before the reservation
 * is touched, so these cases don't need a real reservation row.
 */
class PickupSlotControllerTest extends BaseApiTest {

    private static final LocalDate NEXT_MONDAY =
            LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
    private static final LocalDate NEXT_SATURDAY =
            LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.SATURDAY));

    private String schedule(String token, String slotStart) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "reservationId", 1,
                "slotStart", slotStart));
    }

    @Test
    void rejectsWeekendPickup() throws Exception {
        String token = registerStudent(uniqueEmail("pickup-weekend"), "password123");
        mockMvc.perform(post("/api/pickup-slots")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(schedule(token, NEXT_SATURDAY + "T10:00:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pickups are only available Monday to Friday."));
    }

    @Test
    void rejectsBeforeOpeningHours() throws Exception {
        String token = registerStudent(uniqueEmail("pickup-early"), "password123");
        mockMvc.perform(post("/api/pickup-slots")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(schedule(token, NEXT_MONDAY + "T08:00:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pickups must be scheduled between 9:00 AM and 5:00 PM."));
    }

    @Test
    void rejectsWindowRunningPastClosing() throws Exception {
        // 16:45 start + 30-min window ends 17:15, past the 17:00 close.
        String token = registerStudent(uniqueEmail("pickup-late"), "password123");
        mockMvc.perform(post("/api/pickup-slots")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(schedule(token, NEXT_MONDAY + "T16:45:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pickups must be scheduled between 9:00 AM and 5:00 PM."));
    }

    @Test
    void acceptsValidWeekdaySlotAndDerivesEnd() throws Exception {
        String token = registerStudent(uniqueEmail("pickup-valid"), "password123");
        mockMvc.perform(post("/api/pickup-slots")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(schedule(token, NEXT_MONDAY + "T10:00:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slotStart").value(NEXT_MONDAY + "T10:00:00"))
                .andExpect(jsonPath("$.slotEnd").value(NEXT_MONDAY + "T10:30:00"));
    }
}
