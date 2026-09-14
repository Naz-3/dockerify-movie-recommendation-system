package com.naz.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naz.orchestrator.client.MovieServiceClient;
import com.naz.orchestrator.event.ShowcaseGeneratedV1;
import com.naz.orchestrator.event.ShowcaseGenerationFailedV1;
import com.naz.orchestrator.event.ShowcaseGenerationRequestedV1;
import com.naz.orchestrator.messaging.ShowcaseResultProducer;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ShowcaseOrchestrationService {
    private final MovieServiceClient movieServiceClient;
    private final ShowcaseResultProducer resultProducer;
    private final RestClient openAiClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String apiUrl;
    private final String model;

    public ShowcaseOrchestrationService(MovieServiceClient movieServiceClient, ShowcaseResultProducer resultProducer,
            @Value("${orchestrator.openai.api-key}") String apiKey,
            @Value("${orchestrator.openai.url}") String apiUrl,
            @Value("${orchestrator.openai.model}") String model) {
        this.movieServiceClient = movieServiceClient;
        this.resultProducer = resultProducer;
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
    }

    public void orchestrate(ShowcaseGenerationRequestedV1 event) {
        try {
            MovieServiceClient.ShowcaseGenerationContext context =
                    movieServiceClient.getGenerationContext(event.userId(), event.city());
            if (context == null || context.candidates() == null || context.candidates().isEmpty()) {
                throw new IllegalStateException("Movie-service returned no recommendation candidates");
            }
            AiSelection selection = selectWithAi(context);
            resultProducer.publishGenerated(new ShowcaseGeneratedV1(UUID.randomUUID(), event.correlationId(), Instant.now(),
                    event.userId(), event.city(), selection.title(),
                    "AI Direktör Önerisi - %s | %.1f°C | Nem: %d%%".formatted(
                            context.weatherMain(), context.temperature(), context.humidity()),
                    selection.selectedContentIds(), "Showcase generation completed"));
        } catch (Exception exception) {
            resultProducer.publishFailed(new ShowcaseGenerationFailedV1(UUID.randomUUID(), event.correlationId(), Instant.now(),
                    event.userId(), event.city(), safeMessage(exception)));
        }
    }

    private AiSelection selectWithAi(MovieServiceClient.ShowcaseGenerationContext context) throws Exception {
        if (apiKey == null || apiKey.isBlank()) throw new IllegalStateException("OPENAI_API_KEY is not configured");
        String catalog = context.candidates().stream().map(candidate ->
                "ID: %d | %s | %s | %s".formatted(candidate.id(), candidate.title(), candidate.genre(), candidate.type()))
                .reduce((left, right) -> left + "\n" + right).orElseThrow();
        String prompt = "Weather: %s, %.1f C, humidity %d%%. Candidates:\n%s\n".formatted(
                context.weatherMain(), context.temperature(), context.humidity(), catalog)
                + "Respond only as JSON: {\"title\":\"...\",\"selectedContentIds\":[1,2,3]}. "
                + "Choose only supplied IDs and diversify genres.";
        Map<String, Object> body = Map.of("model", model, "messages", List.of(
                Map.of("role", "system", "content", "You are a streaming showcase director."),
                Map.of("role", "user", "content", prompt)));
        Map<?, ?> response = openAiClient.post().uri(apiUrl).header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json").body(body).retrieve().body(Map.class);
        List<?> choices = (List<?>) response.get("choices");
        Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        return objectMapper.readValue((String) message.get("content"), AiSelection.class);
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        return message == null ? exception.getClass().getSimpleName() : message.substring(0, Math.min(message.length(), 1900));
    }

    public record AiSelection(String title, List<Integer> selectedContentIds) {}
}
