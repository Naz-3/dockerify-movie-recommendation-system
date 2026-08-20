package com.naz.movieapi1.controller;

import com.naz.movieapi1.entity.Episode;
import com.naz.movieapi1.service.EpisodeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/episodes")
@CrossOrigin(origins = "*")
public class EpisodeController {

    private final EpisodeService episodeService;

    public EpisodeController(EpisodeService episodeService) {
        this.episodeService = episodeService;
    }

    @GetMapping("/content/{contentId}")
    public List<Episode> getEpisodes(
            @PathVariable Integer contentId){

        return episodeService.getEpisodes(contentId);

    }

    @PutMapping("/{id}")
    public Episode updateEpisode(@PathVariable Integer id,
                                 @RequestBody Episode updated) {

        return episodeService.updateEpisode(id, updated);
    }

    @PostMapping("/sync/{id}")
    public Episode syncEpisode(@PathVariable Integer id) {

        return episodeService.syncEpisode(id);
    }
}