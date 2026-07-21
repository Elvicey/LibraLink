package com.codequest.libralink.service;

import com.codequest.libralink.entity.AudioBookTrack;
import com.codequest.libralink.entity.UserAudioProgress;
import com.codequest.libralink.repository.AudioBookTrackRepository;
import com.codequest.libralink.repository.UserAudioProgressRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AudioBookTrackService {

    private final AudioBookTrackRepository audioBookTrackRepository;
    private final UserAudioProgressRepository userAudioProgressRepository;

    public AudioBookTrackService(AudioBookTrackRepository audioBookTrackRepository,
                                UserAudioProgressRepository userAudioProgressRepository) {
        this.audioBookTrackRepository = audioBookTrackRepository;
        this.userAudioProgressRepository = userAudioProgressRepository;
    }

    public List<AudioBookTrack> getAllTracks() {
        List<AudioBookTrack> tracks = audioBookTrackRepository.findAll();
        // Seed default demo tracks if database is fresh
        if (tracks.isEmpty()) {
            AudioBookTrack track1 = new AudioBookTrack(
                    "Data Structures: Linked Lists",
                    "CS 301 - Dr. O. Asiedu",
                    "CS 301",
                    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    1450, // 24m 10s
                    18.4
            );
            AudioBookTrack track2 = new AudioBookTrack(
                    "Algorithms: Sorting & Searching",
                    "CS 302 - Prof. E. Boateng",
                    "CS 302",
                    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                    1800, // 30m 00s
                    22.5
            );
            AudioBookTrack track3 = new AudioBookTrack(
                    "Database Systems: SQL & Indexing",
                    "CS 401 - Dr. K. Mensah",
                    "CS 401",
                    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                    2100, // 35m 00s
                    26.1
            );
            audioBookTrackRepository.saveAll(List.of(track1, track2, track3));
            return audioBookTrackRepository.findAll();
        }
        return tracks;
    }

    public Optional<AudioBookTrack> getTrackById(Integer id) {
        return audioBookTrackRepository.findById(id);
    }

    public AudioBookTrack saveTrack(AudioBookTrack track) {
        return audioBookTrackRepository.save(track);
    }

    public List<AudioBookTrack> getTracksByCourse(String courseCode) {
        return audioBookTrackRepository.findByCourseCodeIgnoreCase(courseCode);
    }

    // Playback Progress logic
    public UserAudioProgress saveOrUpdateProgress(Integer userId, Integer trackId, Integer positionSeconds, Boolean isCompleted) {
        Optional<UserAudioProgress> existing = userAudioProgressRepository.findByUserIdAndTrackId(userId, trackId);
        UserAudioProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
            progress.setCurrentPositionSeconds(positionSeconds);
            if (isCompleted != null) {
                progress.setCompleted(isCompleted);
            }
        } else {
            progress = new UserAudioProgress(userId, trackId, positionSeconds, isCompleted != null ? isCompleted : false);
        }
        return userAudioProgressRepository.save(progress);
    }

    public Optional<UserAudioProgress> getUserProgressForTrack(Integer userId, Integer trackId) {
        return userAudioProgressRepository.findByUserIdAndTrackId(userId, trackId);
    }

    public List<UserAudioProgress> getAllUserProgress(Integer userId) {
        return userAudioProgressRepository.findByUserId(userId);
    }
}
