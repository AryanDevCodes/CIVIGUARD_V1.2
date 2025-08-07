package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.weather.WeatherDataResponse;
import com.civiguard.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * Get current weather for a specific district
     */
    @GetMapping("/{district}")
    public ResponseEntity<ApiResponse<WeatherDataResponse>> getCurrentWeather(@PathVariable String district) {
        WeatherDataResponse weatherData = weatherService.getCurrentWeather(district);
        return ResponseEntity.ok(ApiResponse.success(weatherData));
    }

    /**
     * Get all active weather warnings
     */
    @GetMapping("/warnings")
    public ResponseEntity<ApiResponse<List<WeatherDataResponse>>> getAllActiveWarnings() {
        List<WeatherDataResponse> warnings = weatherService.getAllActiveWarnings();
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    /**
     * Get active warnings for a specific district
     */
    @GetMapping("/warnings/{district}")
    public ResponseEntity<ApiResponse<List<WeatherDataResponse>>> getActiveWarningsForDistrict(
            @PathVariable String district) {
        List<WeatherDataResponse> warnings = weatherService.getActiveWarningsForDistrict(district);
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    /**
     * Manually trigger weather data update from external API (Admin only)
     */
    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateWeatherData() {
        weatherService.fetchAndUpdateWeatherData();
        return ResponseEntity.ok(ApiResponse.success("Weather data updated successfully"));
    }

    /**
     * OPTIONAL: Get historical weather data for a district (last N days)
     */
    @GetMapping("/history/{district}")
    public ResponseEntity<ApiResponse<List<WeatherDataResponse>>> getWeatherHistory(
            @PathVariable String district,
            @RequestParam(defaultValue = "7") int days) {
        List<WeatherDataResponse> history = weatherService.getWeatherHistory(district, days);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * OPTIONAL: Get forecast data if supported by external API
     */
    @GetMapping("/forecast/{district}")
    public ResponseEntity<ApiResponse<List<WeatherDataResponse>>> getWeatherForecast(
            @PathVariable String district) {
        List<WeatherDataResponse> forecast = weatherService.getWeatherForecast(district);
        return ResponseEntity.ok(ApiResponse.success(forecast));
    }
}
