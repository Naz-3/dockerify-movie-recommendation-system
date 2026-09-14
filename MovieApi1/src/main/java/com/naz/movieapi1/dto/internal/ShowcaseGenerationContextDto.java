package com.naz.movieapi1.dto.internal;

import java.util.List;

public record ShowcaseGenerationContextDto(
        Long userId,
        String city,
        String weatherMain,
        Double temperature,
        Integer humidity,
        List<ShowcaseCandidateDto> candidates
) {
}
