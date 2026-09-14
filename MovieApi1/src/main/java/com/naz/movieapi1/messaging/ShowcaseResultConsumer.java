package com.naz.movieapi1.messaging;

import com.naz.movieapi1.messaging.event.ShowcaseGeneratedV1;
import com.naz.movieapi1.messaging.event.ShowcaseGenerationFailedV1;
import com.naz.movieapi1.service.ShowcaseGenerationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ShowcaseResultConsumer {
    private final ShowcaseGenerationService generationService;

    public ShowcaseResultConsumer(ShowcaseGenerationService generationService) {
        this.generationService = generationService;
    }

    @KafkaListener(topics = "${showcase.kafka.topics.generated}")
    public void generated(ShowcaseGeneratedV1 event) {
        generationService.applyGenerated(event);
    }

    @KafkaListener(topics = "${showcase.kafka.topics.generation-failed}")
    public void failed(ShowcaseGenerationFailedV1 event) {
        generationService.applyFailed(event);
    }
}
