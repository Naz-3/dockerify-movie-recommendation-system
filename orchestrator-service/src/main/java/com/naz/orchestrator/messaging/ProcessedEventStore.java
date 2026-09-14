package com.naz.orchestrator.messaging;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Infrastructure-only idempotency guard. It protects one running instance from
 * duplicate event IDs. Replace it with a durable shared store before horizontal
 * scaling or relying on it across restarts.
 */
@Component
public class ProcessedEventStore {

    private final Set<UUID> processedEventIds = ConcurrentHashMap.newKeySet();

    public boolean markIfNew(UUID eventId) {
        return processedEventIds.add(eventId);
    }
}
