
package com.civiguard.repository;

import com.civiguard.model.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {
    Optional<WeatherData> findFirstByDistrictOrderByTimestampDesc(String district);
    
    List<WeatherData> findByDistrictAndIsWarningActiveTrue(String district);
    
    List<WeatherData> findByIsWarningActiveTrue();
    List<WeatherData> findByDistrictAndTimestampAfterOrderByTimestampDesc(String district, LocalDateTime timestamp);
List<WeatherData> findByDistrictAndForecastTimeAfterOrderByForecastTimeAsc(String district, LocalDateTime now);

}
