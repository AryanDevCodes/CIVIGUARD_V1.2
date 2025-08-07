
package com.civiguard.dto.alert;

import com.civiguard.model.Alert.AlertSeverity;
import com.civiguard.model.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AlertRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must be less than 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    @NotNull(message = "Severity is required")
    private AlertSeverity severity;

    private Location location;

    private Double radius; // in kilometers

    private LocalDateTime startTime = LocalDateTime.now();

    private LocalDateTime endTime;
}
