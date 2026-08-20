package com.naz.movieapi1.service;

import java.util.Map;

public interface UserAnalyticsService {
    Map<String, Double> calculateGenrePreferences(Long userId);
    String getUserPreferenceSummaryForAI(Long userId);
}