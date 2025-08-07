package com.civiguard.dto.incident;

import com.civiguard.model.Incident.IncidentStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateIncidentStatusRequest {
    @NotNull(message = "Status is required")
    private IncidentStatus status;
    
    private String notes;
}
