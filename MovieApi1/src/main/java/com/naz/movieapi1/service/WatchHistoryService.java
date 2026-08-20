package com.naz.movieapi1.service;

import com.naz.movieapi1.entity.WatchHistory;

import java.util.List;

public interface WatchHistoryService {
    WatchHistory saveOrUpdateProgress(Long userId,Integer contentId, Integer watchedMinutes, Boolean isLiked);
    List<WatchHistory> getUserWatchHistory(Long userId);
}
