package com.naz.movieapi1.service;

import com.naz.movieapi1.entity.Episode;

import java.util.List;

public interface EpisodeService {

    List<Episode> getEpisodes(Integer contentId);

    Episode updateEpisode(Integer id, Episode updated);

    Episode syncEpisode(Integer id);
}