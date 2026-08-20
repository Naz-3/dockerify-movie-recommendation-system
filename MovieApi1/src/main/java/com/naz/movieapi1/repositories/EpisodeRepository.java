package com.naz.movieapi1.repositories;

import com.naz.movieapi1.entity.Episode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EpisodeRepository extends JpaRepository<Episode, Integer> {

    List<Episode> findByContentIdOrderBySeasonNumberAscEpisodeNumberAsc(Integer contentId);

    List<Episode> findByContentImdbIdAndSeasonNumber(String imdbId, Integer seasonNumber);

    Optional<Episode> findByImdbId(String imdbId);

    boolean existsByImdbId(String imdbId);
}