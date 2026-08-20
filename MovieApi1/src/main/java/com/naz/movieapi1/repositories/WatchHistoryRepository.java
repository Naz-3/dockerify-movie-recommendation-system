package com.naz.movieapi1.repositories;

import com.naz.movieapi1.entity.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {

//users all watch history
    List<WatchHistory> findByUserId(Long userId);

//belirli icerikteki son izleme durumu
    Optional<WatchHistory> findByUserIdAndContentId(Long userId, Long contentId);

//sadece belirli tamamlanma orani uzarindekileri getir
    List<WatchHistory> findByUserIdAndCompletionRateGreaterThanEqual(Long userId, Double completionRate);
}

