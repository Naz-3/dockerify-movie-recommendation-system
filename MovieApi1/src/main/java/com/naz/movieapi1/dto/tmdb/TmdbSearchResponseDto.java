package com.naz.movieapi1.dto.tmdb;

import java.util.List;

public class TmdbSearchResponseDto {
    private List<TmdbMovieResponseDto> results;

    public List<TmdbMovieResponseDto> getResults() { return results; }
    public void setResults(List<TmdbMovieResponseDto> results) { this.results = results; }
}