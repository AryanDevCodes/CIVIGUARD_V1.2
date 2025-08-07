
package com.civiguard.dto.weather;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WeatherDataResponse {
    private Long id;
    private String district;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private String weatherCondition;
    private Double precipitation;
    private Double visibility;
    private LocalDateTime timestamp;
    private LocalDateTime forecastTime;
    private Boolean isWarningActive;
    private String warningType;
    private String warningDescription;
}
