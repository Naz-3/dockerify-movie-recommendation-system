package com.naz.movieapi1.dto.details;

import lombok.Data;

@Data
public class MovieDetailDto {
    private Integer id;
    private String imdbId;
    private String title;
    private Integer year;
    private String poster;
    private String genre;
    private String runtime;
    private String director;
    private String actors;
    private String plot;
    private Double rating;
    private String type;
    private String status;
    private String source;
    private String language;
    private String country;
    private String awards;
}
