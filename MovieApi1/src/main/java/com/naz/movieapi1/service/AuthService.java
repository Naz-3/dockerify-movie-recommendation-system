package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.user.AuthResponse;
import com.naz.movieapi1.dto.user.LoginRequest;
import com.naz.movieapi1.dto.user.RegisterRequest;
import com.naz.movieapi1.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}