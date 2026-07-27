package com.codequest.libralink.service;

import com.codequest.libralink.entity.AudioBookTrack;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.entity.UserAudioProgress;
import com.codequest.libralink.repository.AudioBookTrackRepository;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import com.codequest.libralink.repository.UserAudioProgressRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AudioBookTrackService {

    private final AudioBookTrackRepository audioBookTrackRepository;
    private final UserAudioProgressRepository userAudioProgressRepository;
    private final BookRepository bookRepository;
    private final InstitutionRepository institutionRepository;

    public AudioBookTrackService(AudioBookTrackRepository audioBookTrackRepository,
                                UserAudioProgressRepository userAudioProgressRepository,
                                BookRepository bookRepository,
                                InstitutionRepository institutionRepository) {
        this.audioBookTrackRepository = audioBookTrackRepository;
        this.userAudioProgressRepository = userAudioProgressRepository;
        this.bookRepository = bookRepository;
        this.institutionRepository = institutionRepository;
    }

    /** Best-effort fallback school for entities with no natural school owner (demo seed data). */
    private Integer fallbackSchoolId() {
        return institutionRepository.findByShortName("DEFAULT")
                .or(() -> institutionRepository.findAll().stream().findFirst())
                .map(Institution::getInstitutionId)
                .orElse(null);
    }

    public List<AudioBookTrack> getAllTracks() {
        List<AudioBookTrack> tracks = audioBookTrackRepository.findAll();
        // Seed default demo tracks if database is fresh
        if (tracks.isEmpty()) {
            Integer schoolId = fallbackSchoolId();
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
            track1.setSchoolId(schoolId);
            track2.setSchoolId(schoolId);
            track3.setSchoolId(schoolId);
            audioBookTrackRepository.saveAll(List.of(track1, track2, track3));
            return audioBookTrackRepository.findAll();
        }
        return tracks;
    }

    public Optional<AudioBookTrack> getTrackById(Integer id) {
        return audioBookTrackRepository.findById(id);
    }

    public AudioBookTrack saveTrack(AudioBookTrack track) {
        if (track.getSchoolId() == null) {
            Integer schoolId = null;
            if (track.getBook() != null) {
                schoolId = track.getBook().getInstitution() != null
                        ? track.getBook().getInstitution().getInstitutionId()
                        : bookRepository.findById(track.getBook().getId())
                                .map(b -> b.getInstitution() != null ? b.getInstitution().getInstitutionId() : null)
                                .orElse(null);
            }
            track.setSchoolId(schoolId != null ? schoolId : fallbackSchoolId());
        }
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
            Integer schoolId = audioBookTrackRepository.findById(trackId)
                    .map(AudioBookTrack::getSchoolId)
                    .orElse(null);
            progress.setSchoolId(schoolId);
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
