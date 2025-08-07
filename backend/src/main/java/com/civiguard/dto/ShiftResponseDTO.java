package com.civiguard.dto;

import com.civiguard.model.Location;
import com.civiguard.model.Shift;
import com.civiguard.model.ShiftStatus;
import com.civiguard.model.ShiftType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class ShiftResponseDTO {
    private Long id;
    private String title;
    private ShiftType type;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Location location;
    private String description;
    private ShiftStatus status;
    private Set<Long> assignedOfficerIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static ShiftResponseDTO fromEntity(Shift shift) {
        if (shift == null) {
            return null;
        }
        
        ShiftResponseDTO dto = new ShiftResponseDTO();
        dto.setId(shift.getId());
        dto.setTitle(shift.getTitle());
        dto.setType(shift.getType());
        dto.setStartTime(shift.getStartTime());
        dto.setEndTime(shift.getEndTime());
        dto.setLocation(shift.getLocation());
        dto.setDescription(shift.getDescription());
        dto.setStatus(shift.getStatus());
        
        // Safely get officer IDs
        if (shift.getAssignedOfficers() != null) {
            dto.setAssignedOfficerIds(shift.getAssignedOfficers().stream()
                    .map(officer -> officer != null ? officer.getId() : null)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet()));
        }
        
        dto.setCreatedAt(shift.getCreatedAt());
        dto.setUpdatedAt(shift.getUpdatedAt());
        return dto;
    }
}
