package com.naz.orchestrator.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Versioned command event. The eventual workflow implementation will consume this
 * contract; no movie-service business logic is invoked at this infrastructure stage.
 */
public record ShowcaseGenerationRequestedV1(
        UUID eventId,
        UUID correlationId,
        Instant occurredAt,
        Long userId,
        String city
) {
}
