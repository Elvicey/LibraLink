package com.codequest.libralink;

import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificationControllerTest extends BaseApiTest {

    private String librarianToken;
    private String studentToken;
    private User testStudent;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = createAndGetLibrarianToken(
                uniqueEmail("notiflib"), "pass1234");
        testStudent = createTestStudent(uniqueEmail("notifstu"), "pass1234");
        studentToken = loginAs(testStudent.getEmail(), "pass1234");
    }

    @Test
    void createNotification_asLibrarian() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", testStudent.getId(),
                                        "type", "BORROW_REMINDER",
                                        "title", "Book Due Soon",
                                        "message", "Your book is due in 2 days."
                                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Book Due Soon"))
                .andExpect(jsonPath("$.isRead").value(false));
    }

    @Test
    void getUserNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications/user/" + testStudent.getId())
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getAllNotifications_asLibrarian() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearerToken(librarianToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void markAsRead() throws Exception {
        String createResult = mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", testStudent.getId(),
                                        "type", "GENERAL",
                                        "title", "Read Test",
                                        "message", "This will be read"
                                ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer notifId = objectMapper.readTree(createResult).get("id").asInt();

        mockMvc.perform(put("/api/notifications/" + notifId + "/read")
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    void markAllAsRead() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", testStudent.getId(),
                                        "type", "GENERAL",
                                        "title", "Unread 1",
                                        "message", "msg1"
                                ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(librarianToken))
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of(
                                        "userId", testStudent.getId(),
                                        "type", "GENERAL",
                                        "title", "Unread 2",
                                        "message", "msg2"
                                ))))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/notifications/user/" + testStudent.getId() + "/read-all")
                        .header("Authorization", bearerToken(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.marked").isNumber());
    }
}
