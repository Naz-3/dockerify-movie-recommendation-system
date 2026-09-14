package com.naz.movieapi1.messaging.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ShowcaseGeneratedV1(
        UUID eventId, UUID correlationId, Instant occurredAt, Long userId, String city,
        String title, String triggerReason, List<Integer> selectedContentIds, String message
) {
}
