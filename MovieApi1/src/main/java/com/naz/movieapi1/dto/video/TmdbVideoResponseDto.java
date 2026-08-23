package com.naz.movieapi1.dto.video;

import java.util.List;

public class TmdbVideoResponseDto {
    private Integer id;
    private List<VideoDto> results;

    public TmdbVideoResponseDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public List<VideoDto> getResults() { return results; }
    public void setResults(List<VideoDto> results) { this.results = results; }
}