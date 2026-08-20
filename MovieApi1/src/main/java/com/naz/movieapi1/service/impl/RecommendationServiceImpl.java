package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.service.RecommendationService;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationServiceImpl implements RecommendationService {
    private static final double WEIGHT_GENRE_AFFINITY = 0.50;
    private static final double WEIGHT_COMPLETION_RATE = 0.30;
    private static final double WEIGHT_WEATHER_MATCH= 0.20;

    public RecommendationServiceImpl() {
    }

    @Override
    public List<Content> getTopRecommendedContents(
            List<Content> allContents,
            List<WatchHistory> watchHistories,
            WeatherApiResponseDto weather,
            int limit){
        if (allContents == null || allContents.isEmpty()){
            return Collections.emptyList();
        }
        //user watch history tur bazli puan haritasi
        Map<String, Double> userGenreScores = calculateGenreAffinity(watchHistories);
        //zatn izlenmis icerik idlerinin tespiti
        Set<Long> watchedContentIds = new HashSet<>();
        if (watchHistories != null){
            for (WatchHistory history : watchHistories){
                if (history.getContent() != null){
                    watchedContentIds.add(Long.valueOf(history.getContent().getId()));
                }
            }
        }
        //izlenmemis iceriikler
        Map<Content, Double> scoredContents = new HashMap<>();
        for (Content content : allContents) {

            if (watchedContentIds.contains(content.getId())) {
                continue;
            }
            // Kullanıcının izleme geçmişi varsa,
            // hiç ilgi göstermediği türleri önerilerden çıkar.
            if (!userGenreScores.isEmpty() && !hasGenreAffinity(content, userGenreScores)) {
                continue;
            }
            double score = calculateContentScore(
                    content,
                    userGenreScores,
                    watchHistories,
                    weather
            );
            scoredContents.put(content, score);
        }
        //skorlara gore listeleme ve istenilen limit kadar dongu
        return scoredContents.entrySet().stream()
                .sorted(Map.Entry.<Content, Double>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();
    }

    private boolean hasGenreAffinity(
            Content content,
            Map<String, Double> userGenreScores) {
        if (content.getGenre() == null || content.getGenre().isBlank()) {
            return false;
        }
        String[] genres = content.getGenre().split(",");
        for (String genre : genres) {
            String cleanGenre = genre.trim();

            if (userGenreScores.getOrDefault(cleanGenre, 0.0) > 0) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Double> calculateGenreAffinity(List<WatchHistory> watchHistories){
        Map<String, Double> genreScores = new HashMap<>();
        if (watchHistories == null || watchHistories.isEmpty()){
            return genreScores;
        }
        for (WatchHistory record : watchHistories){
            Content content = record.getContent();
            if (content == null || content.getGenre() == null) continue;

            double completionRate = record.getCompletionRate();
            //erken cikislarda -
            double impactFactor = completionRate < 0.20 ?- 0.5 : completionRate;
            if (Boolean.TRUE.equals(record.getIsLiked())){
                impactFactor += 0.3; //begenide +
            }

            //turlerin ayrilmasi (,)
            String[] genres = content.getGenre().split(",");
            for (String g : genres){
                String cleanGenre = g.trim();
                genreScores.put(cleanGenre, genreScores.getOrDefault(cleanGenre, 0.0) + impactFactor);
            }
        }
        return normalizeScores(genreScores);
    }

    private double calculateContentScore(
            Content content,
            Map<String, Double> userGenreScores,
            List<WatchHistory> watchHistories,
            WeatherApiResponseDto weather){

        //tur uyumu
        double genreScore = 0.0;
        if (content.getGenre() != null && !userGenreScores.isEmpty()){
            String[] genres = content.getGenre().split(",");
            double totalGenreScore = 0.0;
            for (String g : genres){
                totalGenreScore += userGenreScores.getOrDefault(g.trim(), 0.0);
            }
            genreScore = totalGenreScore / genres.length;
        }
        //ort izleöe tamamlama s
        double avgCompletionRate = 0.5;
        if (watchHistories != null && !watchHistories.isEmpty()){
            avgCompletionRate = watchHistories.stream()
                    .mapToDouble(WatchHistory::getCompletionRate)
                    .average()
                    .orElse(0.5);
        }
        //weather uyum
        double weatherScore = calculateWeatherMatchScore(content, weather);
        //total
        return (genreScore * WEIGHT_GENRE_AFFINITY) +
                (avgCompletionRate * WEIGHT_COMPLETION_RATE) +
                (weatherScore * WEIGHT_WEATHER_MATCH);
    }

    private double calculateWeatherMatchScore(Content content, WeatherApiResponseDto weather){
        if (weather == null || weather.getWeather() == null || weather.getWeather().isEmpty()){
            return 0.5; //notr skor varsayilan
        }
        String mainWeather = weather.getWeather().get(0).getMain().toUpperCase();
        String genre = content.getGenre() != null ? content.getGenre().toLowerCase(): "";

        if (mainWeather.contains("RAIN") || mainWeather.contains("SNOW") || mainWeather.contains("DRIZZLE")){
            if (genre.contains("drama") ||genre.contains("mystery") || genre.contains("thriller")){
                return 1.0;
            }
        }

        else if (mainWeather.contains("CLEAR") || mainWeather.contains("SUN")){
            if(genre.contains("comedy") || genre.contains("adventure") ||genre.contains("action")){
                return 1.0;
            }
        }
        return 0.5;
    }

    private Map<String, Double> normalizeScores(Map<String, Double> rawScores) {
        double maxScore = rawScores.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        if (maxScore <= 0) return rawScores;

        Map<String, Double> normalized = new HashMap<>();
        rawScores.forEach((genre, score) -> normalized.put(genre, Math.max(0.0, score / maxScore)));
        return normalized;
    }
}
