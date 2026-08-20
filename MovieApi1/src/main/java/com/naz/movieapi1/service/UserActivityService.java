package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.user.UserActivityRequestDto;

public interface UserActivityService {
    void trackUserActivity(UserActivityRequestDto request);
}