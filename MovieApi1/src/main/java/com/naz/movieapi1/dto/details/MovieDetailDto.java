package com.naz.movieapi1.dto.details;

import com.naz.movieapi1.dto.video.VideoDto;

import java.util.List;

public class MovieDetailDto {
    private Integer id;
    private String imdbId;
    private String title;
    private Integer year;
    private String type;
    private Double rating;
    private String poster;
    private String genre;
    private String runtime;
    private String director;
    private String actors;
    private String plot;
    private String language;
    private String country;
    private String awards;
    private String status;
    private String source;
    
    private Integer watchedMinutes = 0;
    private Integer totalMinutes = 0;
    private List<VideoDto> videos;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public String getRuntime() { return runtime; }
    public void setRuntime(String runtime) { this.runtime = runtime; }
    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }
    public String getActors() { return actors; }
    public void setActors(String actors) { this.actors = actors; }
    public String getPlot() { return plot; }
    public void setPlot(String plot) { this.plot = plot; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAwards() { return awards; }
    public void setAwards(String awards) { this.awards = awards; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getWatchedMinutes() { return watchedMinutes; }
    public void setWatchedMinutes(Integer watchedMinutes) { this.watchedMinutes = watchedMinutes; }
    public Integer getTotalMinutes() { return totalMinutes; }
    public void setTotalMinutes(Integer totalMinutes) { this.totalMinutes = totalMinutes; }
    public List<VideoDto> getVideos() { return videos; }
    public void setVideos(List<VideoDto> videos) { this.videos = videos; }
}