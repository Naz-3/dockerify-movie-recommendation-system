package com.naz.orchestrator.event;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

/** Versioned result event reserved for the future showcase workflow. */
public record ShowcaseGeneratedV1(
        UUID eventId,
        UUID correlationId,
        Instant occurredAt,
        Long userId,
        String city,
        String title,
        String triggerReason,
        List<Integer> selectedContentIds,
        String message
) {
}
