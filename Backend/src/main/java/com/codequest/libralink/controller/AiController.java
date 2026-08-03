package com.codequest.libralink.controller;

import com.codequest.libralink.dto.AiChatRequest;
import com.codequest.libralink.dto.AiChatResponse;
import com.codequest.libralink.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    // Natural Language Chat API
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> askLibra(@RequestBody AiChatRequest request) {
        if (request == null || request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AiChatResponse("Please enter a valid question or prompt.", "ERROR", List.of()));
        }
        AiChatResponse response = aiService.processQuery(request);
        return ResponseEntity.ok(response);
    }

    // Suggested Prompts Endpoint
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSuggestions() {
        return ResponseEntity.ok(aiService.getSuggestedPrompts());
    }
}
