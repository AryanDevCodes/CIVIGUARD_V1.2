package com.civiguard.service;

import com.civiguard.dto.incident.EvidenceRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.dto.incident.IncidentTimelineResponse;
import com.civiguard.dto.incident.IncidentUpdateRequest;
import com.civiguard.dto.incident.OfficerIncidentResponse;
import com.civiguard.dto.officer.OfficerSummary;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface OfficerIncidentService {
    
    /**
     * Get incidents assigned to a specific officer with optional status filter
     */
    Page<IncidentResponse> getIncidentsAssignedToOfficer(Long officerId, IncidentStatus status, Pageable pageable);
    
    /**
     * Get incident details for an officer (must be assigned to the incident)
     */
    OfficerIncidentResponse getIncidentDetailsForOfficer(Long incidentId, Long officerId);
    
    /**
     * Update incident status
     */
    IncidentResponse updateIncidentStatus(Long incidentId, Long officerId, IncidentStatus status, String notes);
    
    /**
     * Update incident priority
     */
    IncidentResponse updateIncidentPriority(Long incidentId, Long officerId, IncidentPriority priority, String notes);
    
    /**
     * Add an update to an incident
     */
    IncidentResponse addIncidentUpdate(Long incidentId, Long officerId, IncidentUpdateRequest request);
    
    /**
     * Add evidence to an incident
     */
    IncidentResponse addEvidence(Long incidentId, Long officerId, EvidenceRequest request);
    
    /**
     * Reassign incident to another officer
     */
    IncidentResponse assignToOtherOfficer(Long incidentId, Long currentOfficerId, Long newOfficerId, String notes);
    
    /**
     * Get incident timeline (all updates and changes)
     */
    List<IncidentTimelineResponse> getIncidentTimeline(Long incidentId, Long officerId);
    
    /**
     * Get available officers who can be assigned to an incident
     */
    List<OfficerSummary> getAvailableOfficers(Long incidentId, Long requestingOfficerId);
    
    /**
     * Get performance statistics for an officer
     */
    Map<String, Object> getOfficerPerformanceStats(Long officerId);
}
