package com.naz.orchestrator.messaging;

import com.naz.orchestrator.event.ShowcaseGeneratedV1;
import com.naz.orchestrator.event.ShowcaseGenerationFailedV1;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class ShowcaseResultProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String generatedTopic;
    private final String failedTopic;

    public ShowcaseResultProducer(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${orchestrator.topics.showcase-generated}") String generatedTopic,
            @Value("${orchestrator.topics.showcase-generation-failed}") String failedTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.generatedTopic = generatedTopic;
        this.failedTopic = failedTopic;
    }

    public void publishGenerated(ShowcaseGeneratedV1 event) {
        kafkaTemplate.send(generatedTopic, event.correlationId().toString(), event);
    }

    public void publishFailed(ShowcaseGenerationFailedV1 event) {
        kafkaTemplate.send(failedTopic, event.correlationId().toString(), event);
    }
}
