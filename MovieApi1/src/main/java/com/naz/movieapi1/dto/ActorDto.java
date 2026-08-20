package com.naz.movieapi1.dto;

import com.naz.movieapi1.dto.search.MovieItemDto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter

public class ActorDto {
    private Long id;
    private String name;
    private int movieCount;
    private int seriesCount;
    private Double highestRating;
    private MovieItemDto topMovie;
    private List<MovieItemDto> filmography;
    private Integer contentCount;
}