package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.EpisodeDto;
import com.naz.movieapi1.entity.Episode;
import com.naz.movieapi1.exception.MovieNotFoundException;
import com.naz.movieapi1.repositories.EpisodeRepository;
import com.naz.movieapi1.service.EpisodeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class EpisodeServiceImpl implements EpisodeService {

    private final EpisodeRepository episodeRepository;

    private final RestClient restClient = RestClient.create();

    @Value("${omdb.api.key}")
    private String apiKey;

    public EpisodeServiceImpl(EpisodeRepository episodeRepository) {
        this.episodeRepository = episodeRepository;
    }

    @Override
    public List<Episode> getEpisodes(Integer contentId) {

        return episodeRepository
                .findByContentIdOrderBySeasonNumberAscEpisodeNumberAsc(contentId);
    }

    @Override
    public Episode updateEpisode(Integer id, Episode updated) {

        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() ->
                        new MovieNotFoundException("Bölüm bulunamadı."));

        episode.setPoster(updated.getPoster());
        episode.setPlot(updated.getPlot());

        episode.setPosterCustomized(true);
        episode.setPlotCustomized(true);

        return episodeRepository.save(episode);
    }

    @Override
    public Episode syncEpisode(Integer id) {

        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() ->
                        new MovieNotFoundException("Bölüm bulunamadı."));

        String url =
                "https://www.omdbapi.com/?apikey="
                        + apiKey
                        + "&i="
                        + episode.getImdbId();

        EpisodeDto omdbEpisode = restClient.get()
                .uri(url)
                .retrieve()
                .body(EpisodeDto.class);

        if (omdbEpisode == null) {
            throw new MovieNotFoundException("OMDb bölüm bilgisi bulunamadı.");
        }

        episode.setPoster(omdbEpisode.getPoster());
        episode.setPlot(omdbEpisode.getPlot());

        episode.setPosterCustomized(false);
        episode.setPlotCustomized(false);

        episode.setTitle(omdbEpisode.getTitle());
        episode.setRuntime(omdbEpisode.getRuntime());

        try {
            episode.setRating(Double.parseDouble(omdbEpisode.getImdbRating()));
        } catch (Exception ignored) {
        }

        return episodeRepository.save(episode);
    }
}