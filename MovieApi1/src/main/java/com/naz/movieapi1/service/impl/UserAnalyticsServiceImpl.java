package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.repositories.WatchHistoryRepository;
import com.naz.movieapi1.service.UserAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAnalyticsServiceImpl implements UserAnalyticsService {
    private final WatchHistoryRepository watchHistoryRepository;

    //izleme gecmisi incelenerek ture gore kisisellestirilmis puan haritasi
    @Override
    public Map<String, Double> calculateGenrePreferences(Long userId){
        //veritabanindan izleme gecmisi cekiliyor
        List<WatchHistory> histories = watchHistoryRepository.findByUserId(userId);
        Map<String, Double> genreScores = new HashMap<>();

        for (WatchHistory history : histories){
            if (history.getContent() == null || history.getContent().getGenre() == null){
                continue;
            }

            //user icerigin ne kadarini izledi    (%10 = 0.10 completionRate)
            double completionRate = history.getCompletionRate();
            //icerigi begendiyse isLiked == true ile +0.30
            //eger icerigi 3 dakika izleyip kapattiysa 0.03
            double likeBonus = Boolean.TRUE.equals(history.getIsLiked()) ? 0.3 : 0.0;
            double totalWeight = completionRate + likeBonus;

            //bir icerik birden fazla tur. hesaplanan totalWeight her ture ekleniyor
            String[] genres = history.getContent().getGenre().split(",");
            for (String g : genres){
                String genre = g.trim();
                genreScores.put(genre, genreScores.getOrDefault(genre, 0.0) + totalWeight);
            }
        }
        return genreScores;
    }

    @Override
    public String getUserPreferenceSummaryForAI(Long userId) {
        Map<String, Double> preferences = calculateGenrePreferences(userId);

        if (preferences.isEmpty()) {
            return "Kullanıcının henüz yeterli izleme verisi yok. Genel popüler içerikleri tercih edebilir.";
        }

        //reserved ile tum turlerin puanini buyukten kucuge ve top3 turu filtreler
        List<Map.Entry<String, Double>> topGenres = preferences.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(3)
                .collect(Collectors.toList());

        StringBuilder summary = new StringBuilder("Kullanıcının İzleme Tercihleri (Ağırlıklı): ");
        for (Map.Entry<String, Double> entry : topGenres) {
            summary.append(String.format("%s (Ağırlık Puanı: %.2f), ", entry.getKey(), entry.getValue()));
        }

        return summary.toString();
    }
}
