package com.naz.movieapi1.dto.search;

import lombok.Data;

@Data
public class SearchResultDto {
    private String title;
    private String year;
    private String poster;
    private String imdbId;
    private String source;
    private String type;
    private Integer id;
}