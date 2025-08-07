package com.civiguard.dto.geofence;

import com.civiguard.model.GeoFencePoint;
import com.civiguard.model.Location;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for {@link GeoFencePoint} entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoFencePointResponse {
    private Long id;
    private Location location;
    private Integer pointOrder;
    private Long geofenceId;

    /**
     * Converts a {@link GeoFencePoint} entity to a {@link GeoFencePointResponse} DTO.
     *
     * @param point the GeoFencePoint entity to convert
     * @return the converted GeoFencePointResponse, or null if the input is null
     */
    public static GeoFencePointResponse fromEntity(GeoFencePoint point) {
        if (point == null) {
            return null;
        }
        
        return GeoFencePointResponse.builder()
                .id(point.getId())
                .location(point.getLocation())
                .pointOrder(point.getPointOrder())
                .geofenceId(point.getGeofence() != null ? point.getGeofence().getId() : null)
                .build();
    }
    
    /**
     * Creates a list of GeoFencePointResponse from a list of GeoFencePoint entities.
     *
     * @param points the list of GeoFencePoint entities to convert
     * @return a list of GeoFencePointResponse objects
     */
    public static List<GeoFencePointResponse> fromEntities(List<GeoFencePoint> points) {
        if (points == null) {
            return List.of();
        }
        return points.stream()
                .map(GeoFencePointResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }
}