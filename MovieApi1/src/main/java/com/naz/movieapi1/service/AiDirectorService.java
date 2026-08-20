package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.external.AiDirectorResponseDto;
import com.naz.movieapi1.entity.Content;
import java.util.List;

import com.naz.movieapi1.dto.external.WeatherApiResponseDto;

public interface AiDirectorService {

    AiDirectorResponseDto generateShowcaseSuggestion(
            WeatherApiResponseDto weather,
            List<Content> availableContents
    );
}