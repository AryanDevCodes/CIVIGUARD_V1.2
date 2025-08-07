package com.civiguard.dto.patrol;

import com.civiguard.model.PatrolRoute;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatrolRouteDTO {
    private Long id;
    private String name;
    private List<WaypointDTO> waypoints;
    private Long assignedOfficerId;
    private String status;
    private PatrolVehicleDTO patrolVehicle;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaypointDTO {
        private Double lat;
        private Double lng;
    }

    public static PatrolRouteDTO fromEntity(PatrolRoute route) {
        if (route == null) {
            return null;
        }

        return PatrolRouteDTO.builder()
            .id(route.getId())
            .name(route.getName())
            .status(route.getStatus().name())
            .assignedOfficerId(route.getAssignedOfficer() != null ? 
                route.getAssignedOfficer().getId() : null)
            .patrolVehicle(route.getPatrolVehicle() != null ? 
                PatrolVehicleDTO.fromEntity(route.getPatrolVehicle()) : null)
            .waypoints(route.getWaypoints() != null ? 
                route.getWaypoints().stream()
                    .map(wp -> WaypointDTO.builder()
                        .lat(wp.getLat())
                        .lng(wp.getLng())
                        .build())
                    .collect(Collectors.toList()) : null)
            .build();
    }
}