package com.codequest.libralink.controller;

import com.codequest.libralink.entity.AudioTrack;
import com.codequest.libralink.security.CurrentUserProvider;
import com.codequest.libralink.service.AudioTrackService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private final AudioTrackService audioTrackService;
    private final CurrentUserProvider currentUserProvider;

    public AudioController(AudioTrackService audioTrackService, CurrentUserProvider currentUserProvider) {
        this.audioTrackService = audioTrackService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/convert")
    public ResponseEntity<?> initiateConversion(@RequestBody Map<String, Object> body) {
        try {
            Integer bookId = toInteger(body.get("bookId"));
            // Audio conversions are personal; always generated for the caller.
            Integer userId = currentUserProvider.getCurrentUserId();
            String voiceName = body.get("voiceName") != null ? String.valueOf(body.get("voiceName")) : "en-US-Standard-A";
            String languageCode = body.get("languageCode") != null ? String.valueOf(body.get("languageCode")) : "en-US";
            String content = body.get("content") != null ? String.valueOf(body.get("content")) : null;
            if (content == null && body.get("text") != null) {
                content = String.valueOf(body.get("text"));
            }

            if (bookId == null || userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "bookId and userId are required."));
            }

            AudioTrack track = audioTrackService.initiateConversion(
                    bookId, userId, voiceName, languageCode, content);
            audioTrackService.processConversion(track.getId());

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                    "message", "Audio conversion initiated",
                    "trackId", track.getId(),
                    "status", track.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTrack(@PathVariable Integer id) {
        AudioTrack track = audioTrackService.getTrack(id).orElse(null);
        if (track == null) {
            return ResponseEntity.notFound().build();
        }
        currentUserProvider.requireSelfOrAnyRole(track.getUserId(), "LIBRARIAN", "ADMIN");
        return ResponseEntity.ok(track);
    }

    @PreAuthorize("@currentUserProvider.isSelfOrHasAnyRole(#userId, 'LIBRARIAN', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AudioTrack>> getUserTracks(@PathVariable Integer userId) {
        return ResponseEntity.ok(audioTrackService.getUserTracks(userId));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<AudioTrack>> getBookTracks(@PathVariable Integer bookId) {
        List<AudioTrack> tracks = audioTrackService.getBookTracks(bookId);
        // These are personal conversions, not shared catalog content: non-staff
        // callers only ever see their own tracks for this book.
        if (!currentUserProvider.hasAnyRole("LIBRARIAN", "ADMIN")) {
            Integer currentUserId = currentUserProvider.getCurrentUserId();
            tracks = tracks.stream()
                    .filter(t -> t.getUserId() != null && t.getUserId().equals(currentUserId))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(tracks);
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<?> streamAudio(@PathVariable Integer id,
                                          @RequestHeader(value = "Range", required = false) String range) {
        AudioTrack track = audioTrackService.getTrack(id).orElse(null);
        if (track == null) {
            return ResponseEntity.notFound().build();
        }
        currentUserProvider.requireSelfOrAnyRole(track.getUserId(), "LIBRARIAN", "ADMIN");

        if (!"COMPLETED".equals(track.getStatus()) || track.getAudioUrl() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Audio track is not ready to stream",
                    "trackId", track.getId(),
                    "status", track.getStatus() != null ? track.getStatus() : "UNKNOWN",
                    "errorMessage", track.getErrorMessage() != null ? track.getErrorMessage() : ""
            ));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/" + track.getAudioFormat()));
        headers.set("Accept-Ranges", "bytes");
        headers.set("Content-Disposition", "inline; filename=\"" + track.getTitle() + "." + track.getAudioFormat() + "\"");

        if (track.getDurationSeconds() != null) {
            headers.set("X-Audio-Duration", String.valueOf(track.getDurationSeconds()));
        }

        return ResponseEntity.ok().headers(headers).body(Map.of(
                "trackId", track.getId(),
                "title", track.getTitle(),
                "audioUrl", track.getAudioUrl(),
                "format", track.getAudioFormat(),
                "durationSeconds", track.getDurationSeconds() != null ? track.getDurationSeconds() : 0
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrack(@PathVariable Integer id) {
        AudioTrack track = audioTrackService.getTrack(id).orElse(null);
        if (track == null) {
            return ResponseEntity.notFound().build();
        }
        currentUserProvider.requireSelfOrAnyRole(track.getUserId(), "LIBRARIAN", "ADMIN");
        audioTrackService.deleteTrack(id);
        return ResponseEntity.noContent().build();
    }
}
