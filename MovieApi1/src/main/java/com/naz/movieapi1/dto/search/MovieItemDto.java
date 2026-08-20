package com.naz.movieapi1.dto.search;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter

public class MovieItemDto {
    private Integer id;
    private String title;
    private Integer year;
    private String type;
    private Double rating;
    private String poster;
    private String genre;
}