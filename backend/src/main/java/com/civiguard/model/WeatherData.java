
package com.civiguard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "weather_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String district;
    
    private Double temperature;
    
    private Double humidity;
    
    private Double windSpeed;
    
    private String weatherCondition;
    
    private Double precipitation;
    
    private Double visibility;
    
    @CreationTimestamp
    private LocalDateTime timestamp;
    
    private LocalDateTime forecastTime;
    
    private Boolean isWarningActive;
    
    private String warningType;
    
    private String warningDescription;
}
