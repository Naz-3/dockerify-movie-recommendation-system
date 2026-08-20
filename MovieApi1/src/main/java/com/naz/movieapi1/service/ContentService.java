package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.omdb.OmdbDto;
import com.naz.movieapi1.dto.omdb.OmdbSearchItemDto;
import com.naz.movieapi1.dto.search.SearchResultDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.dto.SeasonDto;
import com.naz.movieapi1.dto.details.MovieDetailDto;

import java.util.ArrayList;
import java.util.List;

public interface ContentService {

    List<Content> getAll();
    Content getById(Integer id);
    Content save(Content content);
    void delete(Integer id);
    Content update(Integer id, Content updated);
    List<OmdbSearchItemDto> searchMovies(String title);
    OmdbDto getMovieByImdbId(String imdbId);
    Content importMovie(String imdbId);
    Content createCustomContent(Content content);
    Content updateStatus(Integer id, String status);
    Content syncMovie(Integer id);
    void syncAllContents();
    List<SeasonDto> getSeasons(String imdbId);
    SeasonDto getSeasonDetails(String imdbId, Integer season);

    List<SearchResultDto> searchAll(String title);
    MovieDetailDto getDetails(Integer id);
    MovieDetailDto getOmdbDetails(String imdbId);

    MovieDetailDto fetchFromTmdb(String title);

    Content importTmdbMovie(String tmdbId);
    List<Content> importBulkMovies(List<String> imdbIds);
    List<Content> importBulkTmdbMovies(List<String> tmdbIds);
}