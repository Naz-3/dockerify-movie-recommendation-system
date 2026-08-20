package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
//unit testleri.
class RecommendationServiceTest {

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        //testlerden once servis bagimliligi
        recommendationService = new RecommendationServiceImpl();
    }

    @Test
    @DisplayName("Romantik film izleyicisine Korku filmi önerilmemelidir")
    void romanceUserShouldNotReceiveHorrorRecommendations() {
        // 1. GIVEN (Hazırlık): Romantik izleme geçmişi ve karışık içerik havuzu
        WatchHistory romanceHistory = createWatchHistoryWithGenre("Romance");

        Content romanceMovie = createContent(1, "Love Story", "Romance");
        Content horrorMovie = createContent(2, "The Conjuring", "Horror");
        List<Content> availableContents = List.of(romanceMovie, horrorMovie);

        WeatherApiResponseDto mockWeather = new WeatherApiResponseDto(); // Hava durumu bağımlılığı için boş mock

        // 2. WHEN (Eylem): Öneri servisi çağrıldığında
        List<Content> recommendations = recommendationService.getTopRecommendedContents(
                availableContents,
                List.of(romanceHistory),
                mockWeather,
                5
        );

        // 3. THEN (Doğrulama): Sonuçlar arasında Korku (Horror) filmi bulunmamalıdır
        boolean containsHorror = recommendations.stream()
                .anyMatch(content -> "Horror".equalsIgnoreCase(content.getGenre()));

        assertFalse(containsHorror, "Romantik içerik izleyen kullanıcıya korku filmi önerilmemelidir!");
    }

    @Test
    @DisplayName("Aksiyon filmi izleyicisine ilk olarak Aksiyon kategorisinden öneri yapılmalıdır")
    void actionUserShouldReceiveActionRecommendations() {
        // 1. GIVEN (Hazırlık): Aksiyon izleme geçmişi
        WatchHistory actionHistory = createWatchHistoryWithGenre("Action");

        Content actionMovie = createContent(1, "Die Hard", "Action");
        Content romanceMovie = createContent(2, "The Notebook", "Romance");
        List<Content> availableContents = List.of(romanceMovie, actionMovie);

        WeatherApiResponseDto mockWeather = new WeatherApiResponseDto();

        // 2. WHEN (Eylem): Öneri servisi çağrıldığında
        List<Content> recommendations = recommendationService.getTopRecommendedContents(
                availableContents,
                List.of(actionHistory),
                mockWeather,
                5
        );

        // 3. THEN (Doğrulama): Öneri listesi boş olmamalı ve ilk eleman Aksiyon türünde olmalıdır
        assertFalse(recommendations.isEmpty(), "Öneri listesi boş olmamalıdır.");
        assertEquals("Action", recommendations.get(0).getGenre(),
                "Aksiyon izleyicisine önerilen ilk film Aksiyon kategorisinden olmalıdır!");
    }

    // --- TEST YARDIMCI (HELPER) METOTLARI ---

    private Content createContent(Integer id, String title, String genre) {
        Content content = new Content();
        content.setId(id);
        content.setTitle(title);
        content.setGenre(genre);
        return content;
    }

    private WatchHistory createWatchHistoryWithGenre(String genre) {
        WatchHistory history = new WatchHistory();
        Content content = new Content();

        content.setId(999);
        content.setGenre(genre);
        content.setTitle("Watched " + genre);
        content.setDurationInMinutes(120);

        history.setContent(content);
        history.setWatchedMinutes(120);
        history.setCompletionRate(1.0);
        history.setIsLiked(true);

        return history;
    }
}