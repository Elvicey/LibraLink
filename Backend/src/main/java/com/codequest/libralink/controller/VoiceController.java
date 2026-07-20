package com.codequest.libralink.controller;

import com.codequest.libralink.entity.VoiceCommand;
import com.codequest.libralink.service.VoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    private final VoiceService voiceService;

    public VoiceController(VoiceService voiceService) {
        this.voiceService = voiceService;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processVoice(@RequestBody Map<String, Object> body) {
        try {
            Integer userId = (Integer) body.get("userId");
            String transcribedText = (String) body.get("text");

            if (userId == null || transcribedText == null || transcribedText.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId and text are required."));
            }

            VoiceCommand command = voiceService.processVoiceCommand(userId, transcribedText);

            return ResponseEntity.ok(Map.of(
                    "commandId", command.getId(),
                    "transcribedText", command.getTranscribedText(),
                    "detectedIntent", command.getDetectedIntent() != null ? command.getDetectedIntent() : "UNKNOWN",
                    "responseText", command.getResponseText() != null ? command.getResponseText() : "",
                    "status", command.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history/user/{userId}")
    public ResponseEntity<List<VoiceCommand>> getCommandHistory(@PathVariable Integer userId) {
        return ResponseEntity.ok(voiceService.getUserCommands(userId));
    }
}
