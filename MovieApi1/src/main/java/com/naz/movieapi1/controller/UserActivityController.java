package com.naz.movieapi1.controller;

import com.naz.movieapi1.dto.user.UserActivityRequestDto;
import com.naz.movieapi1.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-activity")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Frontend CORS ayarınıza göre düzenleyebilirsiniz
public class UserActivityController {

    private final UserActivityService userActivityService;

    @PostMapping("/track")
    public ResponseEntity<String> trackActivity(@RequestBody UserActivityRequestDto request) {
        userActivityService.trackUserActivity(request);
        return ResponseEntity.ok("Aktivite başarıyla kaydedildi/güncellendi.");
    }
}