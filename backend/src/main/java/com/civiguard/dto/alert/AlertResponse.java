package com.civiguard.dto.alert;

import com.civiguard.model.Alert.AlertSeverity;
import com.civiguard.model.Location;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AlertResponse {
    private Long id;
    private String title;
    private String description  ;
    private AlertSeverity severity;
    private Location location;
    private Double radius;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isActive;
    private UserSummary createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isRead;

    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String role;
    }
}