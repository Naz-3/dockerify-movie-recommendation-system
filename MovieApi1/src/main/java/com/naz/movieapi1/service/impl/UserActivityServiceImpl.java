package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.user.UserActivityRequestDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.User;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.UserRepository;
import com.naz.movieapi1.repositories.WatchHistoryRepository;
import com.naz.movieapi1.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserActivityServiceImpl implements UserActivityService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;

    @Override
    @Transactional
    public void trackUserActivity(UserActivityRequestDto request) {
        // 1. Kullanıcı kaydı var mı kontrol et
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + request.getUserId()));

        // 2. İçerik kaydı var mı kontrol et
        Content content = contentRepository.findById(Math.toIntExact(request.getContentId()))
                .orElseThrow(() -> new RuntimeException("İçerik bulunamadı: " + request.getContentId()));

        // 3. Kullanıcı bu içeriği daha önce izlemiş mi? Varsa getir, yoksa yeni oluştur
        WatchHistory watchHistory = watchHistoryRepository
                .findByUserIdAndContentId(request.getUserId(), request.getContentId())
                .orElseGet(() -> {
                    WatchHistory newHistory = new WatchHistory();
                    newHistory.setUser(user);
                    newHistory.setContent(content);
                    return newHistory;
                });

        // 4. İzlenen dakikayı güncelle (Eğer null değilse)
        if (request.getWatchedMinutes() != null) {
            watchHistory.setWatchedMinutes(request.getWatchedMinutes());
        }

        // 5. Beğeni durumunu güncelle (Eğer null değilse)
        if (request.getIsLiked() != null) {
            watchHistory.setIsLiked(request.getIsLiked());
        }

        watchHistory.setWatchedAt(LocalDateTime.now());

        // Save edildiğinde Entity içerisindeki @PreUpdate / @PrePersist
        // metodu otomatik çalışacak ve completionRate değerini hesaplayacaktır.
        watchHistoryRepository.save(watchHistory);
    }
}