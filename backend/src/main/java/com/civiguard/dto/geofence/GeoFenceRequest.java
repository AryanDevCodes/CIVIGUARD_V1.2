
package com.civiguard.dto.geofence;

import com.civiguard.model.GeoFence;
import com.civiguard.model.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class GeoFenceRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Fence type is required")
    private GeoFence.FenceType type;
    
    private Double radiusKm;
    
    private Location center;
    
    private List<Location> polygonPoints = new ArrayList<>();
    
    @NotNull(message = "Fence purpose is required")
    private GeoFence.FencePurpose purpose;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
}
