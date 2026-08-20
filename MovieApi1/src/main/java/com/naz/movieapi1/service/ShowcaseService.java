package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.showcase.ShowcaseDetailDto;
import com.naz.movieapi1.dto.showcase.ShowcaseSuggestionDto;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface ShowcaseService {

    @Transactional
    ShowcaseSuggestionDto generateWeatherBasedShowcase(Long userId, String city);

    @Transactional
    ShowcaseSuggestionDto generateWeatherBasedShowcase(String city);

    void approveShowcase(Long showcaseId, String updatedTitle, List<Integer> updatedMovieIds, LocalDate scheduledDate);
    List<ShowcaseSuggestionDto> getCalenderShowCases(LocalDate start, LocalDate end);
    ShowcaseDetailDto getShowcase(Long showcaseId);
    void deleteDraft(Long id);

    List<ShowcaseSuggestionDto> getAllShowcases();

    Object getAllShowcases(String currentUsername, String city);
}