package com.civiguard.dto.incident;

import com.civiguard.model.Incident.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a timeline event for an incident
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentTimelineResponse {
    /** When the event occurred */
    private LocalDateTime timestamp;
    
    /** Type of event (e.g., "STATUS_CHANGE", "EVIDENCE_ADDED", "OFFICER_ASSIGNED") */
    private String eventType;
    
    /** Human-readable description of the event */
    private String description;
    
    /** Name of the user who performed the action */
    private String performedBy;
    
    /** New status after this event (if status changed) */
    private IncidentStatus newStatus;
    
    /** Additional details about the event */
    private String details;
}
