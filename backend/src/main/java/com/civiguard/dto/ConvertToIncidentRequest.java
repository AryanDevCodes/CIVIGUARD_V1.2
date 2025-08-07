package com.civiguard.dto;

import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

/**
 * DTO for converting a Report to an Incident
 */
@Data
public class ConvertToIncidentRequest {
    @NotNull
    private IncidentPriority priority;
    
    @NotNull
    private IncidentStatus status;
    
    private Set<Long> assignedOfficerIds;
    
    private String resolutionNotes;
}
