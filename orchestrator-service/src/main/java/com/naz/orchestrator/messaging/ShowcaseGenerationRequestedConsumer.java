package com.naz.orchestrator.messaging;

import com.naz.orchestrator.event.ShowcaseGenerationRequestedV1;
import com.naz.orchestrator.service.ShowcaseOrchestrationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class ShowcaseGenerationRequestedConsumer {

    private static final Logger log = LoggerFactory.getLogger(ShowcaseGenerationRequestedConsumer.class);

    private final ProcessedEventStore processedEventStore;
    private final ShowcaseOrchestrationService orchestrationService;

    public ShowcaseGenerationRequestedConsumer(ProcessedEventStore processedEventStore,
            ShowcaseOrchestrationService orchestrationService) {
        this.processedEventStore = processedEventStore;
        this.orchestrationService = orchestrationService;
    }

    @KafkaListener(topics = "${orchestrator.topics.showcase-generation-requested}")
    public void consume(ShowcaseGenerationRequestedV1 event) {
        if (event.eventId() == null || event.correlationId() == null) {
            throw new IllegalArgumentException("eventId and correlationId are required");
        }
        if (!processedEventStore.markIfNew(event.eventId())) {
            log.info("Duplicate showcase generation request skipped: eventId={}, correlationId={}",
                    event.eventId(), event.correlationId());
            return;
        }

        log.info("Showcase generation request received: eventId={}, correlationId={}, userId={}, city={}",
                event.eventId(), event.correlationId(), event.userId(), event.city());
        orchestrationService.orchestrate(event);
    }
}
