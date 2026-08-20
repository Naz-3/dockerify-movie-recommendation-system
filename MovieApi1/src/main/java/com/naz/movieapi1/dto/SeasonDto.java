package com.naz.movieapi1.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class SeasonDto {

    private String title;
    private String season;
    private Integer episodeCount;
    private List<EpisodeDto> episodes;
}
