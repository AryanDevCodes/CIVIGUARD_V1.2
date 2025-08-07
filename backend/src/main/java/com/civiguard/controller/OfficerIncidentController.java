package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.incident.EvidenceRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.dto.incident.IncidentTimelineResponse;
import com.civiguard.dto.incident.IncidentUpdateRequest;
import com.civiguard.dto.incident.OfficerIncidentResponse;
import com.civiguard.dto.officer.OfficerSummary;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.OfficerIncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/officer/incidents")
@RequiredArgsConstructor
@Tag(name = "Officer Incident Management", description = "Endpoints for officers to manage assigned incidents")
public class OfficerIncidentController {

    private final OfficerIncidentService officerIncidentService;

    @GetMapping
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Get incidents assigned to the officer with optional status filter")
    public ResponseEntity<Page<IncidentResponse>> getAssignedIncidents(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) IncidentStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(
            officerIncidentService.getIncidentsAssignedToOfficer(userPrincipal.getId(), status, pageable)
        );
    }

    @GetMapping("/{incidentId}")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Get incident details by ID (officer must be assigned)")
    public ResponseEntity<OfficerIncidentResponse> getIncidentDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId) {
        return ResponseEntity.ok(
            officerIncidentService.getIncidentDetailsForOfficer(incidentId, userPrincipal.getId())
        );
    }

    @GetMapping("/{incidentId}/timeline")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Get incident timeline with all updates and changes")
    public ResponseEntity<ApiResponse<List<IncidentTimelineResponse>>> getIncidentTimeline(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId) {
        List<IncidentTimelineResponse> timeline = officerIncidentService
            .getIncidentTimeline(incidentId, userPrincipal.getId());
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Incident timeline retrieved successfully", timeline)
        );
    }

    @PutMapping("/{incidentId}/status")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Update incident status")
    public ResponseEntity<IncidentResponse> updateIncidentStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId,
            @RequestParam IncidentStatus status,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(
            officerIncidentService.updateIncidentStatus(incidentId, userPrincipal.getId(), status, notes)
        );
    }

    @PutMapping("/{incidentId}/priority")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Update incident priority")
    public ResponseEntity<IncidentResponse> updateIncidentPriority(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId,
            @RequestParam IncidentPriority priority,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(
            officerIncidentService.updateIncidentPriority(incidentId, userPrincipal.getId(), priority, notes)
        );
    }

    @PostMapping("/{incidentId}/updates")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Add an update to an incident")
    public ResponseEntity<IncidentResponse> addIncidentUpdate(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId,
            @Valid @RequestBody IncidentUpdateRequest request) {
        return ResponseEntity.ok(
            officerIncidentService.addIncidentUpdate(incidentId, userPrincipal.getId(), request)
        );
    }

    @PostMapping("/{incidentId}/evidence")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Add evidence to an incident")
    public ResponseEntity<IncidentResponse> addEvidence(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId,
            @Valid @RequestBody EvidenceRequest request) {
        return ResponseEntity.ok(
            officerIncidentService.addEvidence(incidentId, userPrincipal.getId(), request)
        );
    }

    @PostMapping("/{incidentId}/reassign")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Reassign incident to another officer")
    public ResponseEntity<IncidentResponse> reassignIncident(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId,
            @RequestParam Long newOfficerId,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(
            officerIncidentService.assignToOtherOfficer(
                incidentId, 
                userPrincipal.getId(), 
                newOfficerId, 
                notes
            )
        );
    }

    @GetMapping("/{incidentId}/officers/available")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Get list of available officers for reassignment")
    public ResponseEntity<ApiResponse<List<OfficerSummary>>> getAvailableOfficers(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long incidentId) {
        List<OfficerSummary> officers = officerIncidentService
            .getAvailableOfficers(incidentId, userPrincipal.getId());
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Available officers retrieved successfully", officers)
        );
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('OFFICER')")
    @Operation(summary = "Get officer's incident statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOfficerStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Officer statistics retrieved successfully",
                officerIncidentService.getOfficerPerformanceStats(userPrincipal.getId())
            )
        );
    }
}
