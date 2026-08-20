package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.WatchHistory;

import java.util.List;

public interface RecommendationService {
    /**icerik listesini user history + hava duruöu skorlamasi*/
    List<Content> getTopRecommendedContents(
            List<Content> allContents,
            List<WatchHistory> watchHistory,
            WeatherApiResponseDto weather,
            int limit
    );
}
