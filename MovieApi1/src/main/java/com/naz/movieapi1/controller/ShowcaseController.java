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

    @GetMapping
    public ResponseEntity<List<ShowcaseSuggestionDto>> getAllShowcases() {
        return ResponseEntity.ok(showcaseService.getAllShowcases());
    }

    @GetMapping("/generate-suggestion")
    public ResponseEntity<ShowcaseSuggestionDto> getSuggestion(
            @RequestParam Long userId,
            @RequestParam String city) {
        return ResponseEntity.ok(showcaseService.generateWeatherBasedShowcase(userId, city));
    }

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
        String currentUsername = authentication.getName();
        var response = showcaseService.getAllShowcases(currentUsername, city);
        return ResponseEntity.ok(response);
    }
}