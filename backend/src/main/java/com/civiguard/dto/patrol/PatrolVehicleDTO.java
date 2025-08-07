package com.civiguard.dto.patrol;

import com.civiguard.model.Location;
import com.civiguard.model.PatrolVehicle;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PatrolVehicleDTO {
    private Long id;
    private String vehicleNumber;
    private String type;
    private String model;
    private String status;
    private Long assignedOfficerId;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String district;
    private LocalDateTime lastLocationUpdate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PatrolVehicleDTO fromEntity(PatrolVehicle vehicle) {
        if (vehicle == null) return null;
        
        PatrolVehicleDTO dto = new PatrolVehicleDTO();
        dto.setId(vehicle.getId());
        dto.setVehicleNumber(vehicle.getVehicleNumber());
        dto.setType(vehicle.getType() != null ? vehicle.getType().name() : null);
        dto.setModel(vehicle.getModel());
        dto.setStatus(vehicle.getStatus() != null ? vehicle.getStatus().name() : null);
        
        // Set location data from embedded Location object
        if (vehicle.getLocation() != null) {
            Location loc = vehicle.getLocation();
            dto.setLatitude(loc.getLatitude());
            dto.setLongitude(loc.getLongitude());
            dto.setAddress(loc.getAddress());
            dto.setCity(loc.getCity());
            dto.setState(loc.getState());
            dto.setCountry(loc.getCountry());
            dto.setPostalCode(loc.getPostalCode());
            dto.setDistrict(loc.getDistrict());
        }
        
        dto.setLastLocationUpdate(vehicle.getLastLocationUpdate());
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());
        
        if (vehicle.getAssignedOfficer() != null) {
            dto.setAssignedOfficerId(vehicle.getAssignedOfficer().getId());
        }
        
        return dto;
    }
}
