package com.naz.movieapi1.service.impl;

import com.naz.movieapi1.dto.user.RegisterRequest;
import com.naz.movieapi1.entity.User;
import com.naz.movieapi1.repositories.UserRepository;
import com.naz.movieapi1.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User registerUser(RegisterRequest request) {
        //kullaniciadi ve email cakisma cont
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Bu Kullanıcı Adı Kullanılıyor!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Bu E-posta adresi sisteme kayıtlı!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());//spring security ya da PasswordEncoder ilerleyen zamanda

        return userRepository.save(user);
    }
}