package com.naz.movieapi1.dto.showcase;

import java.util.UUID;

public record ShowcaseGenerationRequestResponse(Long showcaseId, UUID correlationId, String generationStatus) {
}
