package com.naz.movieapi1.messaging.event;

import java.time.Instant;
import java.util.UUID;

public record ShowcaseGenerationRequestedV1(UUID eventId, UUID correlationId, Instant occurredAt, Long userId, String city) {
}
