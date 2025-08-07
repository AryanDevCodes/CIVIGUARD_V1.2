
package com.civiguard.dto.disaster;

import com.civiguard.model.DisasterAlert;
import com.civiguard.model.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
public class DisasterAlertRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Disaster type is required")
    private DisasterAlert.DisasterType type;
    
    @NotNull(message = "Severity level is required")
    private DisasterAlert.AlertSeverity severity;
    
    private Set<String> affectedAreas = new HashSet<>();
    
    private Location epicenter;
    
    private Double impactRadiusKm;
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;
    
    private LocalDateTime estimatedEndTime;
    
    private Set<Location> evacuationCenters = new HashSet<>();
    
    private Set<String> emergencyContacts = new HashSet<>();
}
