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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class AudioTrackService {

    private static final Logger log = LoggerFactory.getLogger(AudioTrackService.class);

    private final AudioTrackRepository audioTrackRepository;
    private final BookRepository bookRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Text-to-speech runs on the same Google AI Studio (Gemini) key as the rest of the AI
    // features. Gemini TTS returns raw PCM, which we wrap in a WAV container before storing.
    @Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta}")
    private String aiApiBaseUrl;

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${tts.model:gemini-2.5-flash-preview-tts}")
    private String ttsModel;

    @Value("${tts.voice:Kore}")
    private String ttsVoice;

    public AudioTrackService(AudioTrackRepository audioTrackRepository,
                             BookRepository bookRepository,
                             RestTemplate ttsApiRestTemplate) {
        this.audioTrackRepository = audioTrackRepository;
        this.bookRepository = bookRepository;
        this.restTemplate = ttsApiRestTemplate;
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
        track.setSchoolId(book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null);
        track.setTitle((book.getTitle() != null ? book.getTitle() : "Book") + " - Audio Version");
        track.setContent(content);
        track.setVoiceName(voiceName != null && !voiceName.isBlank() ? voiceName : ttsVoice);
        track.setLanguageCode(languageCode != null && !languageCode.isBlank() ? languageCode : "en-US");
        track.setStatus("PENDING");

        return audioTrackRepository.save(track);
    }

    private String resolveContent(Book book, String contentOverride) {
        if (contentOverride != null && !contentOverride.isBlank()) {
            return contentOverride.trim();
        }
        // Prefer the book's full readable text (set by a librarian/admin); fall back to the blurb.
        if (book.getContent() != null && !book.getContent().isBlank()) {
            return book.getContent().trim();
        }
        if (book.getDescription() != null && !book.getDescription().isBlank()) {
            return book.getDescription().trim();
        }
        throw new IllegalStateException(
                "Book has no textual content to convert to audio. "
                        + "Add the book's text, or pass a non-empty \"content\" field in the request body.");
    }

    @Async
    public CompletableFuture<AudioTrack> processConversion(Integer trackId) {
        AudioTrack track = audioTrackRepository.findById(trackId)
                .orElseThrow(() -> new com.codequest.libralink.exception.ResourceNotFoundException(
                        "Audio track not found with id: " + trackId));

        track.setStatus("PROCESSING");
        audioTrackRepository.save(track);

        try {
            // Generates the audio, wraps it as WAV, and stores the bytes + duration on the track.
            String audioUrl = callTtsApi(track);

            track.setAudioUrl(audioUrl);
            track.setStatus("COMPLETED");
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
        if (aiApiKey == null || aiApiKey.isBlank()) {
            throw new RuntimeException("AI API key not configured. Audio generation is unavailable.");
        }

        // Gemini prebuilt voices are single words (e.g. "Kore"); ignore legacy Cloud-TTS style
        // names like "en-US-Standard-A" that may still be stored on older tracks.
        String voice = track.getVoiceName();
        if (voice == null || voice.isBlank() || voice.contains("-")) {
            voice = ttsVoice;
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(Map.of("parts", List.of(
                Map.of("text", truncateContent(track.getContent(), 5000))))));
        requestBody.put("generationConfig", Map.of(
                "responseModalities", List.of("AUDIO"),
                "speechConfig", Map.of(
                        "voiceConfig", Map.of(
                                "prebuiltVoiceConfig", Map.of("voiceName", voice)))));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", aiApiKey);

        String base = aiApiBaseUrl.endsWith("/") ? aiApiBaseUrl.substring(0, aiApiBaseUrl.length() - 1) : aiApiBaseUrl;
        String url = base + "/models/" + ttsModel + ":generateContent";

        ResponseEntity<String> response = restTemplate.postForEntity(
                url, new HttpEntity<>(requestBody, headers), String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode parts = objectMapper.readTree(response.getBody())
                    .path("candidates").path(0).path("content").path("parts");
            for (JsonNode part : parts) {
                JsonNode inline = part.has("inlineData") ? part.path("inlineData") : part.path("inline_data");
                if (!inline.isMissingNode() && inline.has("data")) {
                    String mime = inline.has("mimeType") ? inline.path("mimeType").asText()
                            : inline.path("mime_type").asText("audio/L16;rate=24000");
                    byte[] pcm = Base64.getDecoder().decode(inline.path("data").asText());
                    int sampleRate = sampleRateFromMime(mime);
                    byte[] wav = pcmToWav(pcm, sampleRate);
                    return storeAudio(track, wav, durationSeconds(pcm.length, sampleRate));
                }
            }
        }

        throw new RuntimeException("TTS API call failed with status: " + response.getStatusCode());
    }

    private String storeAudio(AudioTrack track, byte[] wavBytes, int durationSeconds) {
        track.setAudioData(wavBytes);
        track.setAudioFormat("wav");
        track.setDurationSeconds(durationSeconds);
        return "/api/audio/" + track.getId() + "/stream";
    }

    /** Parse the sample rate out of a mime type like "audio/L16;codec=pcm;rate=24000". */
    private int sampleRateFromMime(String mime) {
        if (mime != null) {
            for (String part : mime.split(";")) {
                String p = part.trim();
                if (p.startsWith("rate=")) {
                    try {
                        return Integer.parseInt(p.substring("rate=".length()).trim());
                    } catch (NumberFormatException ignored) {
                        // fall through to default
                    }
                }
            }
        }
        return 24000;
    }

    private int durationSeconds(int pcmBytes, int sampleRate) {
        int byteRate = sampleRate * 2; // mono, 16-bit
        return byteRate > 0 ? Math.round((float) pcmBytes / byteRate) : 0;
    }

    /** Wrap mono 16-bit little-endian PCM in a minimal 44-byte WAV (RIFF) header. */
    private byte[] pcmToWav(byte[] pcm, int sampleRate) {
        int channels = 1;
        int bitsPerSample = 16;
        int byteRate = sampleRate * channels * bitsPerSample / 8;
        int blockAlign = channels * bitsPerSample / 8;
        int dataLen = pcm.length;

        ByteBuffer buf = ByteBuffer.allocate(44 + dataLen).order(ByteOrder.LITTLE_ENDIAN);
        buf.put("RIFF".getBytes(StandardCharsets.US_ASCII));
        buf.putInt(36 + dataLen);
        buf.put("WAVE".getBytes(StandardCharsets.US_ASCII));
        buf.put("fmt ".getBytes(StandardCharsets.US_ASCII));
        buf.putInt(16);                    // PCM fmt chunk size
        buf.putShort((short) 1);           // audio format = PCM
        buf.putShort((short) channels);
        buf.putInt(sampleRate);
        buf.putInt(byteRate);
        buf.putShort((short) blockAlign);
        buf.putShort((short) bitsPerSample);
        buf.put("data".getBytes(StandardCharsets.US_ASCII));
        buf.putInt(dataLen);
        buf.put(pcm);
        return buf.array();
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

    /** Loads only the stored audio bytes for streaming (kept separate so lists stay lightweight). */
    @Transactional(readOnly = true)
    public byte[] getAudioBytes(Integer id) {
        return audioTrackRepository.findById(id).map(AudioTrack::getAudioData).orElse(null);
    }

    @Transactional
    public void deleteTrack(Integer id) {
        audioTrackRepository.deleteById(id);
    }
}
