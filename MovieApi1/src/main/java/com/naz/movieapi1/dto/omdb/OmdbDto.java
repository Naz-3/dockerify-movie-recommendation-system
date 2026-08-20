package com.naz.movieapi1.dto.omdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class OmdbDto {

    @JsonProperty("Title")
    private String title;
    @JsonProperty("Year")
    private String year;
    @JsonProperty("Genre")
    private String genre;
    @JsonProperty("Type")
    private String type;
    @JsonProperty("Poster")
    private String poster;
    @JsonProperty("imdbRating")
    private String imdbRating;
    @JsonProperty("Runtime")
    private String runtime;
    @JsonProperty("Director")
    private String director;
    @JsonProperty("Actors")
    private String actors;
    @JsonProperty("Plot")
    private String plot;
    @JsonProperty("imdbID")
    private String imdbId;
    @JsonProperty("Response")
    private String response;
    @JsonProperty("Error")
    private String error;
    @JsonProperty("totalSeasons")
    private String totalSeasons;
    @JsonProperty("Writer")
    private String writer;
    @JsonProperty("Production")
    private String production;
    @JsonProperty("Country")
    private String country;
    @JsonProperty("Language")
    private String language;
    @JsonProperty("Awards")
    private String awards;
}