package com.codequest.libralink.controller;

import com.codequest.libralink.entity.PodcastEpisode;
import com.codequest.libralink.entity.PodcastShow;
import com.codequest.libralink.service.PodcastEpisodeService;
import com.codequest.libralink.service.PodcastShowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/podcasts")
public class PodcastController {

    private final PodcastShowService podcastShowService;
    private final PodcastEpisodeService podcastEpisodeService;

    public PodcastController(PodcastShowService podcastShowService,
                             PodcastEpisodeService podcastEpisodeService) {
        this.podcastShowService = podcastShowService;
        this.podcastEpisodeService = podcastEpisodeService;
    }

    @GetMapping
    public ResponseEntity<List<PodcastShow>> listShows(
            @RequestParam(required = false, defaultValue = "true") boolean publishedOnly) {
        if (publishedOnly) {
            return ResponseEntity.ok(podcastShowService.listPublishedShows());
        }
        return ResponseEntity.ok(podcastShowService.listAllShows());
    }

    @GetMapping("/episodes/{episodeId}")
    public ResponseEntity<PodcastEpisode> getEpisode(@PathVariable Integer episodeId) {
        return ResponseEntity.ok(podcastEpisodeService.getEpisode(episodeId));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<PodcastEpisode>> listByBook(@PathVariable Integer bookId) {
        return ResponseEntity.ok(podcastEpisodeService.listPublishedByBook(bookId));
    }

    @GetMapping("/{showId}")
    public ResponseEntity<PodcastShow> getShow(@PathVariable Integer showId) {
        return ResponseEntity.ok(podcastShowService.getShow(showId));
    }

    @GetMapping("/{showId}/episodes")
    public ResponseEntity<List<PodcastEpisode>> listEpisodes(
            @PathVariable Integer showId,
            @RequestParam(required = false, defaultValue = "true") boolean publishedOnly) {
        if (publishedOnly) {
            return ResponseEntity.ok(podcastEpisodeService.listPublishedEpisodesForShow(showId));
        }
        return ResponseEntity.ok(podcastEpisodeService.listEpisodesForShow(showId));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<PodcastShow> createShow(@RequestBody PodcastShow show) {
        return new ResponseEntity<>(podcastShowService.createShow(show), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/{showId}")
    public ResponseEntity<PodcastShow> updateShow(@PathVariable Integer showId,
                                                   @RequestBody PodcastShow show) {
        return ResponseEntity.ok(podcastShowService.updateShow(showId, show));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @DeleteMapping("/{showId}")
    public ResponseEntity<Void> deleteShow(@PathVariable Integer showId) {
        podcastShowService.deleteShow(showId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PostMapping("/{showId}/episodes")
    public ResponseEntity<PodcastEpisode> createEpisode(@PathVariable Integer showId,
                                                         @RequestBody PodcastEpisode episode) {
        return new ResponseEntity<>(podcastEpisodeService.createEpisode(showId, episode), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @PutMapping("/episodes/{episodeId}")
    public ResponseEntity<PodcastEpisode> updateEpisode(@PathVariable Integer episodeId,
                                                         @RequestBody PodcastEpisode episode) {
        return ResponseEntity.ok(podcastEpisodeService.updateEpisode(episodeId, episode));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    @DeleteMapping("/episodes/{episodeId}")
    public ResponseEntity<Void> deleteEpisode(@PathVariable Integer episodeId) {
        podcastEpisodeService.deleteEpisode(episodeId);
        return ResponseEntity.noContent().build();
    }
}
