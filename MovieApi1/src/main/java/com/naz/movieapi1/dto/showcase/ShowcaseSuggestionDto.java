package com.naz.movieapi1.dto.showcase;

import java.time.LocalDate;
import java.util.List;

public class ShowcaseSuggestionDto {
    private Long showcaseId;
    private String title;
    private String triggerReason;
    private List<String> movieTitles;
    private LocalDate scheduledDate;

    public ShowcaseSuggestionDto() {}

    public ShowcaseSuggestionDto(Long showcaseId, String title, String triggerReason, List<String> movieTitles, LocalDate scheduledDate) {
        this.showcaseId = showcaseId;
        this.title = title;
        this.triggerReason = triggerReason;
        this.movieTitles = movieTitles;
        this.scheduledDate = scheduledDate;
    }

    public Long getShowcaseId() { return showcaseId; }
    public void setShowcaseId(Long showcaseId) { this.showcaseId = showcaseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTriggerReason() { return triggerReason; }
    public void setTriggerReason(String triggerReason) { this.triggerReason = triggerReason; }

    public List<String> getMovieTitles() { return movieTitles; }
    public void setMovieTitles(List<String> movieTitles) { this.movieTitles = movieTitles; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
}