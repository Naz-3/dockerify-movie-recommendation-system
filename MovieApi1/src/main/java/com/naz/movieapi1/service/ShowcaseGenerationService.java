package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.internal.ShowcaseCandidateDto;
import com.naz.movieapi1.dto.internal.ShowcaseGenerationContextDto;
import com.naz.movieapi1.dto.showcase.ShowcaseGenerationRequestResponse;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.Showcase;
import com.naz.movieapi1.entity.ShowcaseItem;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.messaging.ShowcaseGenerationRequestProducer;
import com.naz.movieapi1.messaging.event.ShowcaseGeneratedV1;
import com.naz.movieapi1.messaging.event.ShowcaseGenerationFailedV1;
import com.naz.movieapi1.messaging.event.ShowcaseGenerationRequestedV1;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.ShowcaseRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShowcaseGenerationService {
    private final ShowcaseRepository showcaseRepository;
    private final ContentRepository contentRepository;
    private final WatchHistoryService watchHistoryService;
    private final WeatherService weatherService;
    private final RecommendationService recommendationService;
    private final ShowcaseGenerationRequestProducer requestProducer;

    public ShowcaseGenerationService(ShowcaseRepository showcaseRepository, ContentRepository contentRepository,
            WatchHistoryService watchHistoryService, WeatherService weatherService,
            RecommendationService recommendationService, ShowcaseGenerationRequestProducer requestProducer) {
        this.showcaseRepository = showcaseRepository;
        this.contentRepository = contentRepository;
        this.watchHistoryService = watchHistoryService;
        this.weatherService = weatherService;
        this.recommendationService = recommendationService;
        this.requestProducer = requestProducer;
    }

    @Transactional
    public ShowcaseGenerationRequestResponse request(Long userId, String city) {
        UUID correlationId = UUID.randomUUID();
        Showcase showcase = new Showcase();
        showcase.setTitle("Vitrin oluşturuluyor");
        showcase.setCity(city);
        showcase.setStatus("PENDING");
        showcase.setGenerationStatus("PENDING");
        showcase.setCorrelationId(correlationId);
        Showcase saved = showcaseRepository.save(showcase);

        requestProducer.publish(new ShowcaseGenerationRequestedV1(
                UUID.randomUUID(), correlationId, Instant.now(), userId, city));
        return new ShowcaseGenerationRequestResponse(saved.getId(), correlationId, "PENDING");
    }

    @Transactional(readOnly = true)
    public ShowcaseGenerationContextDto getContext(Long userId, String city) {
        var weather = weatherService.getCurrentWeather(city);
        if (weather == null || weather.getWeather() == null || weather.getWeather().isEmpty()) {
            throw new IllegalStateException("Weather context is unavailable");
        }
        List<Content> candidates = recommendationService.getTopRecommendedContents(
                contentRepository.findAll(), watchHistoryService.getUserWatchHistory(userId), weather, 15);
        List<ShowcaseCandidateDto> dtoCandidates = candidates.stream()
                .map(c -> new ShowcaseCandidateDto(c.getId(), c.getTitle(), c.getGenre(), c.getYear(), c.getRating(), c.getType()))
                .toList();
        return new ShowcaseGenerationContextDto(userId, city,
                weather.getWeather().get(0).getMain(), weather.getMain().getTemp(), weather.getMain().getHumidity(), dtoCandidates);
    }

    @Transactional
    public void applyGenerated(ShowcaseGeneratedV1 event) {
        Showcase showcase = showcaseRepository.findByCorrelationId(event.correlationId())
                .orElseThrow(() -> new IllegalStateException("Showcase request not found: " + event.correlationId()));
        if ("COMPLETED".equals(showcase.getGenerationStatus()) || event.eventId().equals(showcase.getResultEventId())) return;

        List<Content> contents = contentRepository.findAllById(event.selectedContentIds());
        showcase.setTitle(event.title());
        showcase.setTriggerReason(event.triggerReason());
        showcase.setCity(event.city());
        showcase.setStatus("PENDING"); // existing approval workflow remains unchanged
        showcase.setGenerationStatus("COMPLETED");
        showcase.setGenerationError(null);
        showcase.setResultEventId(event.eventId());
        showcase.setItems(contents.stream().map(content -> {
            ShowcaseItem item = new ShowcaseItem();
            item.setShowcase(showcase);
            item.setContent(content);
            return item;
        }).toList());
        showcaseRepository.save(showcase);
    }

    @Transactional
    public void applyFailed(ShowcaseGenerationFailedV1 event) {
        showcaseRepository.findByCorrelationId(event.correlationId()).ifPresent(showcase -> {
            if ("COMPLETED".equals(showcase.getGenerationStatus()) || event.eventId().equals(showcase.getResultEventId())) return;
            showcase.setGenerationStatus("FAILED");
            showcase.setGenerationError(event.failureReason());
            showcase.setResultEventId(event.eventId());
            showcaseRepository.save(showcase);
        });
    }
}
