package com.naz.orchestrator.client;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MovieServiceClient {
    private final RestClient restClient;

    public MovieServiceClient(@Value("${orchestrator.movie-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public ShowcaseGenerationContext getGenerationContext(Long userId, String city) {
        return restClient.get().uri(uriBuilder -> uriBuilder.path("/internal/showcase/context")
                        .queryParam("userId", userId).queryParam("city", city).build())
                .retrieve().body(ShowcaseGenerationContext.class);
    }

    public record ShowcaseGenerationContext(Long userId, String city, String weatherMain,
                                            Double temperature, Integer humidity,
                                            List<ShowcaseCandidate> candidates) {}
    public record ShowcaseCandidate(Integer id, String title, String genre, Integer year,
                                    Double rating, String type) {}
}
