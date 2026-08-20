package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.entity.User;
import com.naz.movieapi1.entity.WatchHistory;
import com.naz.movieapi1.repositories.ContentRepository;
import com.naz.movieapi1.repositories.UserRepository;
import com.naz.movieapi1.repositories.WatchHistoryRepository;
import com.naz.movieapi1.service.WatchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WatchHistoryServiceImpl implements WatchHistoryService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;

    @Override
    @Transactional
    public WatchHistory saveOrUpdateProgress(Long userId, Integer contentId, Integer watchedMinutes, Boolean isLiked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("İçerik bulunamadı: " + contentId));

        Optional<WatchHistory> existingHistory = watchHistoryRepository.findByUserIdAndContentId(userId, Long.valueOf(contentId));

        WatchHistory watchHistory;
        if (existingHistory.isPresent()) {
            watchHistory = existingHistory.get();
            watchHistory.setWatchedMinutes(watchedMinutes);
            if (isLiked != null) {
                watchHistory.setIsLiked(isLiked);
            }
        } else {
            watchHistory = new WatchHistory(user, content, watchedMinutes, isLiked);
        }

        return watchHistoryRepository.save(watchHistory);
    }

    @Override
    public List<WatchHistory> getUserWatchHistory(Long userId) {
        return watchHistoryRepository.findByUserId(userId);
    }
}