package com.codequest.libralink.controller;

import com.codequest.libralink.entity.AudioBookTrack;
import com.codequest.libralink.entity.UserAudioProgress;
import com.codequest.libralink.service.AudioBookTrackService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audio-tracks")
@CrossOrigin(origins = "*")
public class AudioBookTrackController {

    private final AudioBookTrackService audioBookTrackService;

    public AudioBookTrackController(AudioBookTrackService audioBookTrackService) {
        this.audioBookTrackService = audioBookTrackService;
    }

    // Get all audio tracks
    @GetMapping
    public ResponseEntity<List<AudioBookTrack>> getAllTracks() {
        return ResponseEntity.ok(audioBookTrackService.getAllTracks());
    }

    // Get single audio track by ID
    @GetMapping("/{id}")
    public ResponseEntity<AudioBookTrack> getTrackById(@PathVariable Integer id) {
        return audioBookTrackService.getTrackById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get audio tracks by course code
    @GetMapping("/course/{courseCode}")
    public ResponseEntity<List<AudioBookTrack>> getTracksByCourse(@PathVariable String courseCode) {
        return ResponseEntity.ok(audioBookTrackService.getTracksByCourse(courseCode));
    }

    // Create a new audio track
    @PostMapping
    public ResponseEntity<AudioBookTrack> createTrack(@RequestBody AudioBookTrack track) {
        AudioBookTrack created = audioBookTrackService.saveTrack(track);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // Save or update audio listening progress
    @PostMapping("/{id}/progress")
    public ResponseEntity<UserAudioProgress> saveProgress(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload) {
        
        Integer userId = (Integer) payload.get("userId");
        Integer positionSeconds = (Integer) payload.get("positionSeconds");
        Boolean isCompleted = (Boolean) payload.get("isCompleted");

        if (userId == null || positionSeconds == null) {
            return ResponseEntity.badRequest().build();
        }

        UserAudioProgress progress = audioBookTrackService.saveOrUpdateProgress(userId, id, positionSeconds, isCompleted);
        return ResponseEntity.ok(progress);
    }

    // Get listening progress for a specific track and user
    @GetMapping("/{id}/progress/user/{userId}")
    public ResponseEntity<UserAudioProgress> getProgressForUser(
            @PathVariable Integer id,
            @PathVariable Integer userId) {

        return audioBookTrackService.getUserProgressForTrack(userId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
