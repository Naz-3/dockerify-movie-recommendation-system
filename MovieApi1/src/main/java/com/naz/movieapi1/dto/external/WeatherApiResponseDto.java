package com.naz.movieapi1.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Getter
@Setter

@JsonIgnoreProperties(ignoreUnknown = true)
public class WeatherApiResponseDto {
    private Main main;
    private Wind wind;
    private Clouds clouds;
    private List<Weather> weather;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Weather {
        private String main;
        private String description;
        public Weather() {}
    }
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Main{
        private double temp;
        private int humidity;
    }
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wind{
        private double speed;
    }
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Clouds{
        private int all;
    }
}