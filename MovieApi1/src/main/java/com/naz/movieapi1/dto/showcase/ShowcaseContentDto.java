package com.naz.movieapi1.dto.showcase;

public class ShowcaseContentDto {

    private Long id;
    private String title;

    public ShowcaseContentDto(Long id, String title) {
        this.id = id;
        this.title = title;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }
}