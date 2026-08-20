package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.user.RegisterRequest;
import com.naz.movieapi1.entity.User;

public interface UserService {
    User registerUser(RegisterRequest request);
}