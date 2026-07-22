package com.codequest.libralink.service;

import com.codequest.libralink.entity.AudioTrack;
import com.codequest.libralink.entity.Book;
import com.codequest.libralink.repository.AudioTrackRepository;
import com.codequest.libralink.repository.BookRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class AudioTrackService {

    private static final Logger log = LoggerFactory.getLogger(AudioTrackService.class);

    private final AudioTrackRepository audioTrackRepository;
    private final BookRepository bookRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tts.api.url:https://texttospeech.googleapis.com/v1/text:synthesize}")
    private String ttsApiUrl;

    @Value("${tts.api.key:}")
    private String ttsApiKey;

    @Value("${tts.storage.base-url:}")
    private String storageBaseUrl;

    public AudioTrackService(AudioTrackRepository audioTrackRepository,
                             BookRepository bookRepository) {
        this.audioTrackRepository = audioTrackRepository;
        this.bookRepository = bookRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public AudioTrack initiateConversion(Integer bookId, Integer userId, String voiceName, String languageCode) {
        return initiateConversion(bookId, userId, voiceName, languageCode, null);
    }

    @Transactional
    public AudioTrack initiateConversion(Integer bookId, Integer userId, String voiceName,
                                         String languageCode, String contentOverride) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));

        String content = resolveContent(book, contentOverride);

        AudioTrack track = new AudioTrack();
        track.setBookId(bookId);
        track.setUserId(userId);
        track.setTitle((book.getTitle() != null ? book.getTitle() : "Book") + " - Audio Version");
        track.setContent(content);
        track.setVoiceName(voiceName != null && !voiceName.isBlank() ? voiceName : "en-US-Standard-A");
        track.setLanguageCode(languageCode != null && !languageCode.isBlank() ? languageCode : "en-US");
        track.setStatus("PENDING");

        return audioTrackRepository.save(track);
    }

    private String resolveContent(Book book, String contentOverride) {
        if (contentOverride != null && !contentOverride.isBlank()) {
            return contentOverride.trim();
        }
        if (book.getDescription() != null && !book.getDescription().isBlank()) {
            return book.getDescription().trim();
        }
        throw new IllegalStateException(
                "Book has no textual content to convert to audio. "
                        + "Set the book's description, or pass a non-empty \"content\" field in the request body.");
    }

    @Async
    public CompletableFuture<AudioTrack> processConversion(Integer trackId) {
        AudioTrack track = audioTrackRepository.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Audio track not found"));

        track.setStatus("PROCESSING");
        audioTrackRepository.save(track);

        try {
            String audioUrl = callTtsApi(track);

            track.setAudioUrl(audioUrl);
            track.setStatus("COMPLETED");
            track.setDurationSeconds(estimateDuration(track.getContent()));
            audioTrackRepository.save(track);

            log.info("Audio conversion completed for track {}", trackId);
            return CompletableFuture.completedFuture(track);

        } catch (Exception e) {
            track.setStatus("FAILED");
            track.setErrorMessage(e.getMessage());
            audioTrackRepository.save(track);

            log.error("Audio conversion failed for track {}: {}", trackId, e.getMessage());
            return CompletableFuture.completedFuture(track);
        }
    }

    private String callTtsApi(AudioTrack track) throws Exception {
        if (ttsApiKey == null || ttsApiKey.isBlank()) {
            throw new RuntimeException("TTS API key not configured. Audio generation is unavailable.");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("input", Map.of("text", truncateContent(track.getContent(), 5000)));
        requestBody.put("voice", Map.of(
                "languageCode", track.getLanguageCode(),
                "name", track.getVoiceName()
        ));
        requestBody.put("audioConfig", Map.of(
                "audioEncoding", "MP3",
                "speakingRate", 1.0,
                "pitch", 0.0
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", ttsApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(ttsApiUrl, request, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode json = objectMapper.readTree(response.getBody());
            if (json.has("audioContent")) {
                String audioBase64 = json.get("audioContent").asText();
                return saveAudioFile(track.getId(), audioBase64);
            }
        }

        throw new RuntimeException("TTS API call failed with status: " + response.getStatusCode());
    }

    private String saveAudioFile(Integer trackId, String audioBase64) {
        if (storageBaseUrl != null && !storageBaseUrl.isBlank()) {
            return storageBaseUrl + "/audio/" + trackId + ".mp3";
        }
        return "/api/audio/" + trackId + "/stream";
    }

    private int estimateDuration(String content) {
        if (content == null) return 0;
        int wordCount = content.split("\\s+").length;
        return (int) Math.ceil(wordCount / 150.0 * 60);
    }

    private String truncateContent(String content, int maxLength) {
        if (content.length() <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    }

    @Transactional(readOnly = true)
    public Optional<AudioTrack> getTrack(Integer id) {
        return audioTrackRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<AudioTrack> getUserTracks(Integer userId) {
        return audioTrackRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<AudioTrack> getBookTracks(Integer bookId) {
        return audioTrackRepository.findByBookId(bookId);
    }

    @Transactional
    public void deleteTrack(Integer id) {
        audioTrackRepository.deleteById(id);
    }
}
