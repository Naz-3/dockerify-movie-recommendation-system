package com.naz.orchestrator.event;

import java.time.Instant;
import java.util.UUID;

/** Versioned failure event reserved for the future showcase workflow. */
public record ShowcaseGenerationFailedV1(
        UUID eventId,
        UUID correlationId,
        Instant occurredAt,
        Long userId,
        String city,
        String failureReason
) {
}
