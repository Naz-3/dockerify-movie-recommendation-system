package com.naz.movieapi1.dto.omdb;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class OmdbSearchResponseDto {

    @JsonProperty("Search")
    private List<OmdbSearchItemDto> search;

    @JsonProperty("Response")
    private String response;

    @JsonProperty("Error")
    private String error;

    public OmdbSearchResponseDto() {
    }

    public List<OmdbSearchItemDto> getSearch() {
        return search;
    }

    public void setSearch(List<OmdbSearchItemDto> search) {
        this.search = search;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

}