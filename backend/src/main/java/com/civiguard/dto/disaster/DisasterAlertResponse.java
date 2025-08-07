
package com.civiguard.dto.disaster;

import com.civiguard.model.DisasterAlert;
import com.civiguard.model.Location;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
public class DisasterAlertResponse {
    private Long id;
    private String title;
    private String description;
    private DisasterAlert.DisasterType type;
    private DisasterAlert.AlertSeverity severity;
    private Set<String> affectedAreas = new HashSet<>();
    private Location epicenter;
    private Double impactRadiusKm;
    private LocalDateTime startTime;
    private LocalDateTime estimatedEndTime;
    private boolean isActive;
    private UserSummary createdBy;
    private Set<Location> evacuationCenters = new HashSet<>();
    private Set<String> emergencyContacts = new HashSet<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
