package com.naz.movieapi1.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naz.movieapi1.dto.external.AiDirectorResponseDto;
import com.naz.movieapi1.dto.external.AiPromptRequestDto;
import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import com.naz.movieapi1.entity.Content;
import com.naz.movieapi1.service.AiDirectorService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiDirectorServiceImpl implements AiDirectorService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private List<Integer> selectedContentIds;

    @Value("${openai.api.key:dummy_key}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    public AiDirectorServiceImpl(List<Integer> selectedContentIds) {
        this.selectedContentIds = selectedContentIds;
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public AiDirectorResponseDto generateShowcaseSuggestion(
            WeatherApiResponseDto weather,
            List<Content> availableContents) {
        String contentListText = availableContents.stream()
                .map(c -> String.format("""
                ID: %d
                Başlık: %s
                Tür: %s
                Yıl: %s
                IMDb: %s
                Tip: %s
                """,
                        c.getId(),
                        c.getTitle(),
                        c.getGenre(),
                        c.getYear(),
                        c.getRating(),
                        c.getType()
                ))
                .collect(Collectors.joining("\n"));

        String systemPrompt = "Sen bir dijital yayın platformunun Yapay Zeka İçerik Direktörüsün. " +
                "Sana verilen hava durumuna ve mevcut film/dizi listesine göre operatör için ilgi çekici bir vitrin kurgulamalısın.\n" +
                "Sadece ve sadece şu JSON formatında yanıt ver, başka hiçbir açıklama yazma:\n" +
                "{\n" +
                "  \"title\": \"Vitrin Başlığı\",\n" +
                "  \"reason\": \"AI'ın bu seçimi yapma nedeni\",\n" +
                "  \"selectedContentIds\": [1, 2, 3]\n" +
                "}";


        String userPrompt = String.format("""
                Şehir hava bilgisi

                Ana Durum: %s
                Açıklama: %s
                Sıcaklık: %.1f°C
                Nem: %d%%
                Bulut Oranı: %d%%
                Rüzgar: %.1f m/s
                Mevcut içerikler
                %s
                Kurallar:
                         - Sadece verilen içerikler arasından seçim yap.
                         - selectedContentIds alanına sadece ID numaralarını yaz.
                         - Aynı türden üç içerik seçme.
                         - Hava koşullarına en uygun içerikleri seç.
                         - Daha önce seçilmiş gibi davranma, mümkün olduğunca çeşitli seçimler yap.
                         - Yalnızca geçerli JSON döndür.
                """,
                    weather.getWeather().get(0).getMain(),
                    weather.getWeather().get(0).getDescription(),
                    weather.getMain().getTemp(),
                    weather.getMain().getHumidity(),
                    weather.getClouds().getAll(),
                    weather.getWind().getSpeed(),
                    contentListText
        );

        try {
            AiPromptRequestDto requestBody = new AiPromptRequestDto(model, List.of(
                    new AiPromptRequestDto.Message("system", systemPrompt),
                    new AiPromptRequestDto.Message("user", userPrompt)
            ));

            Map response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            List choices = (List) response.get("choices");
            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");
            String jsonContent = (String) message.get("content");

            return objectMapper.readValue(jsonContent, AiDirectorResponseDto.class);

        } catch (Exception e) {
            System.err.println("AI İstek Hatası: " + e.getMessage());

            AiDirectorResponseDto fallback = new AiDirectorResponseDto();
            fallback.setTitle("Haftanın Öne Çıkanları (Sistem Önerisi)");
            fallback.setReason("Hava durumu: " + weather.getWeather().get(0).getMain());
            List<Content> shuffled = new ArrayList<>(availableContents);
            Collections.shuffle(shuffled);
            fallback.setSelectedContentIds(
                    shuffled.stream()
                            .limit(3)
                            .map(Content::getId)
                            .toList()
            );
            return fallback;
        }
    }
}