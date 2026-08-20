package com.naz.movieapi1;

public enum FilmType {
    COMEDY("Comedy"),
    DRAMA("Drama"),
    HORROR("Horror"),
    SCIENCEFICTION("Science Fiction"),
    ROMANCE("Romance"),
    DOCUMENTARY("Documentary"),
    ANIMATION("Animation"),
    THRILLER("Thriller"),
    WESTERN("Western"),
    ACTION("Action");

    private String displayName;

    FilmType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
