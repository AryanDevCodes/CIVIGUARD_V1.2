package com.civiguard.dto.incident;

import java.util.List;

import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import lombok.Data;

@Data
public class UpdateIncidentRequest {
    private IncidentStatus status;
    private IncidentPriority priority;
    private String notes;
    private List<String> evidenceUrls;
    private List<Long> assignedOfficerIds;
}
