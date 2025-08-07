package com.civiguard.dto.incident;

import com.civiguard.model.Incident.IncidentStatus;
import lombok.Data;

import java.util.List;

@Data
public class IncidentUpdateRequest {
    private IncidentStatus status;
    private String notes;
    private List<String> evidenceUrls;
}
