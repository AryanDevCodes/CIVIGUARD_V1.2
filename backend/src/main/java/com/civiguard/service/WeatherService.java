package com.civiguard.service;

import com.civiguard.dto.weather.WeatherDataResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.WeatherData;
import com.civiguard.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherService {

    private final WeatherDataRepository weatherDataRepository;
    private final RestTemplate restTemplate;

    @Value("${app.weather.api-key}")
    private String apiKey;

    @Value("${app.weather.base-url}")
    private String baseUrl;

    @Transactional(readOnly = true)
    public WeatherDataResponse getCurrentWeather(String district) {
        WeatherData weatherData = weatherDataRepository.findFirstByDistrictOrderByTimestampDesc(district)
                .orElseThrow(() -> new ResourceNotFoundException("Weather data", "district", district));

        return mapToResponse(weatherData);
    }

    @Transactional(readOnly = true)
    public List<WeatherDataResponse> getAllActiveWarnings() {
        return weatherDataRepository.findByIsWarningActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WeatherDataResponse> getActiveWarningsForDistrict(String district) {
        return weatherDataRepository.findByDistrictAndIsWarningActiveTrue(district).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get historical weather data for a given district and number of past days
     */
    @Transactional(readOnly = true)
    public List<WeatherDataResponse> getWeatherHistory(String district, int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        List<WeatherData> history = weatherDataRepository.findByDistrictAndTimestampAfterOrderByTimestampDesc(district, fromDate);
        if (history.isEmpty()) {
            throw new ResourceNotFoundException("Weather history", "district", district);
        }
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get forecast data for a district — stub implementation
     */
    @Transactional(readOnly = true)
    public List<WeatherDataResponse> getWeatherForecast(String district) {
        List<WeatherData> forecasts = weatherDataRepository.findByDistrictAndForecastTimeAfterOrderByForecastTimeAsc(
                district, LocalDateTime.now());

        if (forecasts.isEmpty()) {
            throw new ResourceNotFoundException("Weather forecast", "district", district);
        }

        return forecasts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * To be implemented — fetch and save latest weather from external API
     */
    @Transactional
    public void fetchAndUpdateWeatherData() {
        log.info("Fetching weather data from external API");
        throw new UnsupportedOperationException("Weather data fetching not implemented yet");
    }

    private WeatherDataResponse mapToResponse(WeatherData weatherData) {
        WeatherDataResponse response = new WeatherDataResponse();
        response.setId(weatherData.getId());
        response.setDistrict(weatherData.getDistrict());
        response.setTemperature(weatherData.getTemperature());
        response.setHumidity(weatherData.getHumidity());
        response.setWindSpeed(weatherData.getWindSpeed());
        response.setWeatherCondition(weatherData.getWeatherCondition());
        response.setPrecipitation(weatherData.getPrecipitation());
        response.setVisibility(weatherData.getVisibility());
        response.setTimestamp(weatherData.getTimestamp());
        response.setForecastTime(weatherData.getForecastTime());
        response.setIsWarningActive(weatherData.getIsWarningActive());
        response.setWarningType(weatherData.getWarningType());
        response.setWarningDescription(weatherData.getWarningDescription());
        return response;
    }
}
