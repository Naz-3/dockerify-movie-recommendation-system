package com.naz.movieapi1.messaging;

import com.naz.movieapi1.messaging.event.ShowcaseGenerationRequestedV1;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class ShowcaseGenerationRequestProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String topic;

    public ShowcaseGenerationRequestProducer(KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${showcase.kafka.topics.generation-requested}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publish(ShowcaseGenerationRequestedV1 event) {
        kafkaTemplate.send(topic, event.correlationId().toString(), event);
    }
}
