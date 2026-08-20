package com.naz.movieapi1.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EpisodeDto {

    @JsonAlias("Title")
    private String title;

    @JsonAlias("Episode")
    private String episode;

    @JsonAlias("Released")
    private String released;

    @JsonAlias("imdbRating")
    private String imdbRating;

    @JsonAlias("imdbID")
    private String imdbId;

    @JsonAlias("Poster")
    private String poster;

    @JsonAlias("Plot")
    private String plot;

    @JsonAlias("Runtime")
    private String runtime;
}
