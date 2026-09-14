package com.naz.movieapi1.messaging.event;

import java.time.Instant;
import java.util.UUID;

public record ShowcaseGenerationFailedV1(
        UUID eventId, UUID correlationId, Instant occurredAt, Long userId, String city, String failureReason
) {
}
