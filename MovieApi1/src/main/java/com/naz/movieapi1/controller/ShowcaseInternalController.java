package com.naz.movieapi1.controller;

import com.naz.movieapi1.dto.internal.ShowcaseGenerationContextDto;
import com.naz.movieapi1.service.ShowcaseGenerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/showcase")
public class ShowcaseInternalController {
    private final ShowcaseGenerationService generationService;

    public ShowcaseInternalController(ShowcaseGenerationService generationService) {
        this.generationService = generationService;
    }

    @GetMapping("/context")
    public ResponseEntity<ShowcaseGenerationContextDto> context(@RequestParam Long userId, @RequestParam String city) {
        return ResponseEntity.ok(generationService.getContext(userId, city));
    }
}
