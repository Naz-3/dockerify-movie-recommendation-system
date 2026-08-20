package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.external.AiDirectorResponseDto;
import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import com.naz.movieapi1.dto.showcase.ShowcaseDetailDto;
import com.naz.movieapi1.dto.showcase.ShowcaseSuggestionDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.Showcase;
import com.naz.movieapi1.entity.ShowcaseItem;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.ShowcaseRepository;
import com.naz.movieapi1.service.*;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Service
public class ShowcaseServiceImpl implements ShowcaseService {

    private final WeatherService weatherService;
    private final AiDirectorService aiDirectorService;
    private final ContentRepository contentRepository;
    private final ShowcaseRepository showcaseRepository;
    private final WatchHistoryService watchHistoryService;
    private final UserAnalyticsService userAnalyticsService;
    private final RecommendationService recommendationService;

    public ShowcaseServiceImpl(
            AiDirectorService aiDirectorService,
            WeatherService weatherService,
            ContentRepository contentRepository,
            ShowcaseRepository showcaseRepository,
            WatchHistoryService watchHistoryService,
            UserAnalyticsService userAnalyticsService,
            RecommendationService recommendationService) {
        this.aiDirectorService = aiDirectorService;
        this.weatherService = weatherService;
        this.contentRepository = contentRepository;
        this.showcaseRepository = showcaseRepository;
        this.watchHistoryService = watchHistoryService;
        this.userAnalyticsService = userAnalyticsService;
        this.recommendationService = recommendationService;
    }

    @Transactional
    @Override
    public ShowcaseSuggestionDto generateWeatherBasedShowcase(Long userId, String city) {
        List<Content> availableContents = contentRepository.findAll();

        if (availableContents.isEmpty()) {
            throw new RuntimeException("Veritabanında vitrin kurgulanacak film/dizi bulunamadı!");
        }

        WeatherApiResponseDto weather = weatherService.getCurrentWeather(city);

        // Dinamik Kullanıcı İzleme Geçmişi (Veritabanından canlı çekiliyor)
        List<WatchHistory> userWatchHistory = watchHistoryService.getUserWatchHistory(userId);

        // Öneri Algoritması: Tür ağırlıkları + Tamamlanma oranları + Hava Durumu Uyum Skorlaması
        List<Content> topScoringCandidates = recommendationService.getTopRecommendedContents(
                availableContents,
                userWatchHistory,
                weather,
                15
        );

        try {
            // Kullanıcının ağırlıklı izleme tercihlerini AI için metin özetine dönüştürüyoruz
            String userPreferenceSummary = userAnalyticsService.getUserPreferenceSummaryForAI(userId);

            AiDirectorResponseDto aiResponse = aiDirectorService.generateShowcaseSuggestion(
                    weather,
                    topScoringCandidates
            );

            String triggerReason = String.format(
                    "AI Direktör Önerisi - %s | %.1f°C | Nem: %d%%",
                    weather.getWeather().get(0).getMain(),
                    weather.getMain().getTemp(),
                    weather.getMain().getHumidity()
            );

            List<Integer> selectedIds = aiResponse.getSelectedContentIds();
            List<Content> selectedContents = contentRepository.findAllById(selectedIds);

            List<String> movieTitles = new ArrayList<>();
            for (Content content : selectedContents) {
                movieTitles.add(content.getTitle());
            }

            Showcase showcase = new Showcase();
            String title = aiResponse.getTitle();
            showcase.setTitle(title);
            showcase.setTriggerReason(triggerReason);
            showcase.setCity(city);
            showcase.setStatus("PENDING");
            showcase.setCreatedAt(LocalDateTime.now());

            List<ShowcaseItem> items = createShowcaseItems(showcase, selectedContents);
            showcase.setItems(items);

            Showcase savedShowcase = showcaseRepository.save(showcase);

            return new ShowcaseSuggestionDto(
                    savedShowcase.getId(),
                    title,
                    triggerReason,
                    movieTitles,
                    savedShowcase.getScheduledDate()
            );
        } catch (Exception e) {
            return createFallbackSuggestion(city, topScoringCandidates, weather);
        }
    }

    @Transactional
    @Override
    public ShowcaseSuggestionDto generateWeatherBasedShowcase(String city) {
        return null;
    }

    @Override
    @Transactional
    public void approveShowcase(Long showcaseId, String updatedTitle, List<Integer> updatedMovieIds, LocalDate scheduledDate) {
        Showcase showcase = showcaseRepository.findById(showcaseId)
                .orElseThrow(() -> new RuntimeException("Vitrin bulunamadı: " + showcaseId));

        if (updatedTitle != null && !updatedTitle.isBlank()) {
            showcase.setTitle(updatedTitle);
        }

        if (updatedMovieIds != null && !updatedMovieIds.isEmpty()) {
            List<Content> updatedContents = contentRepository.findAllById(updatedMovieIds);
            showcase.setItems(createShowcaseItems(showcase, updatedContents));
        }

        showcase.setStatus("APPROVED");
        showcase.setApprovedAt(LocalDateTime.now());
        showcase.setScheduledDate(scheduledDate != null ? scheduledDate : LocalDate.now());

        showcaseRepository.save(showcase);
    }

    @Override
    public List<ShowcaseSuggestionDto> getCalenderShowCases(LocalDate start, LocalDate end) {
        List<Showcase> showcases = showcaseRepository.findByScheduledDateBetween(start, end);
        List<ShowcaseSuggestionDto> dtoList = new ArrayList<>();

        for (Showcase showcase : showcases) {
            List<String> titles = new ArrayList<>();
            if (showcase.getItems() != null) {
                for (ShowcaseItem item : showcase.getItems()) {
                    if (item.getContent() != null) {
                        titles.add(item.getContent().getTitle());
                    }
                }
            }
            dtoList.add(new ShowcaseSuggestionDto(
                    showcase.getId(),
                    showcase.getTitle(),
                    showcase.getTriggerReason(),
                    titles,
                    showcase.getScheduledDate()
            ));
        }
        return dtoList;
    }

    public List<ShowcaseSuggestionDto> getCalenderShowCases(String start, String end) {
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        return getCalenderShowCases(startDate, endDate);
    }

    @Override
    public ShowcaseDetailDto getShowcase(Long showcaseId) {
        return null;
    }

    @Override
    public void deleteDraft(Long id) {
        showcaseRepository.deleteById(id);
    }

    @Override
    public List<ShowcaseSuggestionDto> getAllShowcases() {
        // 1. Veritabanından tüm vitrin kayıtlarını çek
        List<Showcase> showcases = showcaseRepository.findAll();

        // 2. Entity listesini DTO listesine çevirip dön
        return showcases.stream()
                .map(showcase -> {
                    ShowcaseSuggestionDto dto = new ShowcaseSuggestionDto();
                    dto.setShowcaseId(showcase.getId());
                    dto.setTitle(showcase.getTitle());
                    // DTO alanlarına göre set işlemleri...
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Object getAllShowcases(String currentUsername, String city) {
        return null;
    }

    private ShowcaseSuggestionDto createFallbackSuggestion(
            String city,
            List<Content> topScoringCandidates,
            WeatherApiResponseDto weather) {

        int limit = Math.min(topScoringCandidates.size(), 3);
        List<Content> fallbackList = topScoringCandidates.subList(0, limit);

        List<String> titles = new ArrayList<>();
        for (Content content : fallbackList) {
            titles.add(content.getTitle());
        }

        String title = city + " İçin Kişiselleştirilmiş Günün Önerileri";
        String reason = String.format(
                "Sistem Önerisi - %s | %.1f°C | Nem: %d%%",
                weather.getWeather().get(0).getMain(),
                weather.getMain().getTemp(),
                weather.getMain().getHumidity()
        );

        Showcase fallbackShowcase = new Showcase();
        fallbackShowcase.setTitle(title);
        fallbackShowcase.setTriggerReason(reason);
        fallbackShowcase.setCity(city);
        fallbackShowcase.setStatus("PENDING");
        fallbackShowcase.setCreatedAt(LocalDateTime.now());

        fallbackShowcase.setItems(createShowcaseItems(fallbackShowcase, fallbackList));

        Showcase saved = showcaseRepository.save(fallbackShowcase);

        return new ShowcaseSuggestionDto(
                saved.getId(),
                title,
                reason,
                titles,
                saved.getScheduledDate()
        );
    }

    private List<ShowcaseItem> createShowcaseItems(Showcase showcase, List<Content> contents) {
        List<ShowcaseItem> items = new ArrayList<>();
        for (Content content : contents) {
            ShowcaseItem item = new ShowcaseItem();
            item.setShowcase(showcase);
            item.setContent(content);
            items.add(item);
        }
        return items;
    }
}