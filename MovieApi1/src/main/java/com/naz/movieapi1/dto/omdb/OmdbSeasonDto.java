package com.naz.movieapi1.dto.omdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.naz.movieapi1.dto.EpisodeDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class OmdbSeasonDto {

    @JsonProperty("Title")
    private String title;

    @JsonProperty("Season")
    private String season;

    @JsonProperty("Episodes")
    private List<EpisodeDto> episodes;
}
