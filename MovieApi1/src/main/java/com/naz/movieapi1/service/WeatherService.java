package com.naz.movieapi1.service;

import com.naz.movieapi1.dto.external.WeatherApiResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class WeatherService {

    private final RestClient restClient;

    private static final String API_KEY = "c18d6605772e9e26d276f64854482929";
    private static final String BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

    public WeatherService() {
        this.restClient = RestClient.create();
    }

    public WeatherApiResponseDto getCurrentWeather(String city) {
        try {
            String url = String.format(
                    "%s?q=%s&appid=%s&units=metric",
                    BASE_URL,
                    city,
                    API_KEY
            );
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(WeatherApiResponseDto.class);
        } catch (Exception e) {
            System.err.println("Hava durumu API isteği sırasında hata oluştu: "
                    + e.getMessage());
            return null;
        }
    }
}