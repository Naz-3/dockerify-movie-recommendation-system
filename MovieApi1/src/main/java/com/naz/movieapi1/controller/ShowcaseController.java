package com.naz.movieapi1.controller;

import com.naz.movieapi1.dto.showcase.ShowcaseDetailDto;
import com.naz.movieapi1.dto.showcase.ShowcaseSuggestionDto;
import com.naz.movieapi1.service.ShowcaseService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.naz.movieapi1.dto.showcase.ShowcaseApproveRequest;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/showcases")
public class ShowcaseController {

    private final ShowcaseService showcaseService;

    public ShowcaseController(ShowcaseService showcaseService) {
        this.showcaseService = showcaseService;
    }

    /**
     * Kök dizine (http://backend:8080/api/v1/showcases) atılan GET isteklerini karşılar.
     * "No static resource api/v1/showcases" hatasını engeller.
     */
    @GetMapping
    public ResponseEntity<List<ShowcaseSuggestionDto>> getAllShowcases() {
        return ResponseEntity.ok(showcaseService.getAllShowcases());
    }

    /**
     * Şehir adına göre hava durumunu kontrol eden ve vitrin taslağı oluşturan endpoint.
     * <p>
     * Örnek İstek (GET):
     * http://backend:8080/api/v1/showcases/suggest?userId=1&city=Istanbul
     *
     * @param city Hava durumu sorgulanacak şehir adı
     * @return Oluşturulan vitrin taslağının DTO detayları
     */
    @GetMapping("/suggest")
    public ResponseEntity<ShowcaseSuggestionDto> getSuggestion(
            @RequestParam Long userId,
            @RequestParam String city) {
        return ResponseEntity.ok(showcaseService.generateWeatherBasedShowcase(userId, city));
    }

    /**
     * Operatörün taslak halindeki bir vitrini onaylayarak yayına almasını sağlayan endpoint.
     * <p>
     * Örnek İstek (POST):
     * http://backend:8080/api/v1/showcases/1/approve
     *
     * @param id Onaylanacak vitrinin veritabanındaki benzersiz kimliği (ID)
     * @return Onay durum mesajı
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approve(
            @PathVariable Long id,
            @RequestBody ShowcaseApproveRequest request) {

        showcaseService.approveShowcase(
                id,
                request.getTitle(),
                request.getMovieIds(),
                request.getScheduledDate());

        return ResponseEntity.ok("Vitrin başarıyla onaylandı.");
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<ShowcaseSuggestionDto>> getCalendar(
            @RequestParam("start") String start,
            @RequestParam("end") String end) {

        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);

        List<ShowcaseSuggestionDto> calendarShowcases = showcaseService.getCalenderShowCases(startDate, endDate);
        return ResponseEntity.ok(calendarShowcases);
    }

    @GetMapping("/{id:\\d+}")
    public ShowcaseDetailDto getShowcase(@PathVariable Long id) {
        return showcaseService.getShowcase(id);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "Kastamonu") String city
    ) {
        // 1. Spring Security Context üzerinden giriş yapan kullanıcının adını alıyoruz
        String currentUsername = authentication.getName();

        // 2. Servisinizdeki mevcut metot adını çağırıyoruz
        // (Örn: getWeatherBasedRecommendations veya getRecommendations)
        var response = showcaseService.getAllShowcases(currentUsername, city);

        return ResponseEntity.ok(response);
    }

}