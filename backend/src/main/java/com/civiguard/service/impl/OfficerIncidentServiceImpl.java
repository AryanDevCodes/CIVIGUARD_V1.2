package com.civiguard.service.impl;

import com.civiguard.dto.incident.EvidenceRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.dto.incident.IncidentTimelineResponse;
import com.civiguard.dto.incident.IncidentUpdateRequest;
import com.civiguard.dto.incident.OfficerIncidentResponse;
import com.civiguard.dto.officer.OfficerSummary;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.exception.UnauthorizedException;
import com.civiguard.model.Evidence;
import com.civiguard.model.Incident;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.IncidentUpdate;
import com.civiguard.model.Officer;
import com.civiguard.model.User;
import com.civiguard.model.Evidence.EvidenceType;
import com.civiguard.repository.EvidenceRepository;
import com.civiguard.repository.IncidentRepository;
import com.civiguard.repository.IncidentUpdateRepository;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.UserRepository;
import com.civiguard.service.NotificationService;
import com.civiguard.service.OfficerIncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementation for managing officer-related incident operations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OfficerIncidentServiceImpl implements OfficerIncidentService {

    private final IncidentRepository incidentRepository;
    private final OfficerRepository officerRepository;
    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final IncidentUpdateRepository incidentUpdateRepository;
    private final NotificationService notificationService;

    /**
     * Retrieves a paginated list of incidents assigned to an officer, optionally filtered by status.
     *
     * @param officerId The ID of the officer.
     * @param status    The incident status to filter by, or null for all statuses.
     * @param pageable  Pagination parameters.
     * @return A page of IncidentResponse DTOs.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<IncidentResponse> getIncidentsAssignedToOfficer(Long officerId, IncidentStatus status, Pageable pageable) {
        validateNotNull(officerId, "Officer ID cannot be null");
        validateOfficerExists(officerId);

        if (status != null) {
            return incidentRepository.findByAssignedOfficersIdAndStatusIn(
                officerId, 
                List.of(status), 
                pageable
            ).map(this::mapToIncidentResponse);
        }
        
        return incidentRepository.findByAssignedOfficersId(officerId, pageable)
            .map(this::mapToIncidentResponse);
    }

    /**
     * Retrieves detailed information about a specific incident for an officer.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer requesting details.
     * @return OfficerIncidentResponse containing incident details.
     */
    @Override
    @Transactional(readOnly = true)
    public OfficerIncidentResponse getIncidentDetailsForOfficer(Long incidentId, Long officerId) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");
        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);

        OfficerIncidentResponse response = OfficerIncidentResponse.fromIncident(incident);
        return response;
    }

    /**
     * Updates the status of an incident and logs the change.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer updating the status.
     * @param status     The new status.
     * @param notes      Additional notes for the update.
     * @return Updated IncidentResponse.
     */
    @Override
    @Transactional
    public IncidentResponse updateIncidentStatus(Long incidentId, Long officerId, IncidentStatus status, String notes) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");
        validateNotNull(status, "Incident status cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);
        User officerUser = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + officerId));

        String statusChange = "Status changed from " + incident.getStatus() + " to " + status;
        String updateContent = statusChange + (notes != null && !notes.isEmpty() ? ": " + notes : "");

        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setStatus(status);
        update.setNotes(notes);
        update.setContent(updateContent);
        update.setUpdatedAt(LocalDateTime.now());
        update.setUpdatedBy(officerUser);

        update = incidentUpdateRepository.save(update);

        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());

        if (status == IncidentStatus.RESOLVED || status == IncidentStatus.CLOSED) {
            incident.setResolutionDate(LocalDateTime.now());
        }

        if (incident.getUpdates() == null) {
            incident.setUpdates(new HashSet<>());
        }
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        try {
            notificationService.notifyUserIncidentStatusChanged(savedIncident);
        } catch (Exception e) {
            log.error("Failed to send status change notification for incident {}", incidentId, e);
        }

        return mapToIncidentResponse(savedIncident);
    }

    /**
     * Updates the priority of an incident and logs the change.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer updating the priority.
     * @param priority   The new priority.
     * @param notes      Additional notes for the update.
     * @return Updated IncidentResponse.
     */
    @Override
    @Transactional
    public IncidentResponse updateIncidentPriority(Long incidentId, Long officerId, IncidentPriority priority, String notes) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");
        validateNotNull(priority, "Incident priority cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);

        if (priority == incident.getPriority()) {
            log.debug("Priority for incident {} is already set to {}", incidentId, priority);
            return mapToIncidentResponse(incident);
        }

        User officerUser = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + officerId));

        String priorityChange = "Priority changed from " + incident.getPriority() + " to " + priority;
        String updateContent = priorityChange + (notes != null && !notes.isEmpty() ? ": " + notes : "");

        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setStatus(incident.getStatus());
        update.setNotes(notes);
        update.setContent(updateContent);
        update.setUpdatedAt(LocalDateTime.now());
        update.setUpdatedBy(officerUser);

        update = incidentUpdateRepository.save(update);

        incident.setPriority(priority);
        incident.setUpdatedAt(LocalDateTime.now());

        if (incident.getUpdates() == null) {
            incident.setUpdates(new HashSet<>());
        }
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        try {
            notificationService.notifyUserIncidentStatusChanged(savedIncident);
        } catch (Exception e) {
            log.error("Failed to send priority change notification for incident {}", incidentId, e);
        }

        return mapToIncidentResponse(savedIncident);
    }

    /**
     * Adds an update to an incident, optionally changing its status.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer adding the update.
     * @param request    The update request containing status, notes, and evidence URLs.
     * @return Updated IncidentResponse.
     */
    @Override
    @Transactional
    public IncidentResponse addIncidentUpdate(Long incidentId, Long officerId, IncidentUpdateRequest request) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");
        validateNotNull(request, "Update request cannot be null");
        validateNotNull(request.getNotes(), "Update notes cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);
        User officerUser = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + officerId));

        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setStatus(request.getStatus() != null ? request.getStatus() : incident.getStatus());
        update.setNotes(request.getNotes());
        update.setUpdatedAt(LocalDateTime.now());
        update.setUpdatedBy(officerUser);

        String content = "Incident update";
        if (request.getStatus() != null) {
            content = "Status updated to " + request.getStatus();
            if (request.getNotes() != null && !request.getNotes().isEmpty()) {
                content += ": " + request.getNotes();
            }
        } else if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            content = request.getNotes();
        }
        update.setContent(content);

        if (request.getEvidenceUrls() != null && !request.getEvidenceUrls().isEmpty()) {
            update.setEvidenceUrls(new ArrayList<>(request.getEvidenceUrls()));
        }

        if (request.getStatus() != null && request.getStatus() != incident.getStatus()) {
            incident.setStatus(request.getStatus());
            if (request.getStatus() == IncidentStatus.RESOLVED || request.getStatus() == IncidentStatus.CLOSED) {
                incident.setResolutionDate(LocalDateTime.now());
            }
        }

        update = incidentUpdateRepository.save(update);

        if (incident.getUpdates() == null) {
            incident.setUpdates(new HashSet<>());
        }
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        try {
            sendIncidentNotification(
                    incident.getReportedBy(),
                    "New update on your incident: " + incident.getTitle(),
                    "INCIDENT_UPDATE"
            );
        } catch (Exception e) {
            log.error("Failed to send update notification for incident {}", incidentId, e);
        }

        return mapToIncidentResponse(savedIncident);
    }

    /**
     * Adds evidence to an incident and logs the action.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer adding the evidence.
     * @param request    The evidence request containing file URL and description.
     * @return Updated IncidentResponse.
     */
    @Override
    @Transactional
    public IncidentResponse addEvidence(Long incidentId, Long officerId, EvidenceRequest request) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");
        validateNotNull(request, "Evidence request cannot be null");
        validateNotNull(request.getFileUrl(), "File URL cannot be null");
        validateNotNull(request.getDescription(), "Evidence description cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + officerId));

        Evidence evidence = new Evidence();
        evidence.setFileUrl(request.getFileUrl());
        evidence.setDescription(request.getDescription());
        evidence.setIncident(incident);
        evidence.setUploadedBy(officer);
        evidence.setUploadedAt(LocalDateTime.now());

        if (request.getType() != null) {
            try {
                evidence.setType(EvidenceType.valueOf(request.getType().name()));
            } catch (IllegalArgumentException e) {
                evidence.setType(EvidenceType.OTHER);
                log.warn("Invalid evidence type {} for incident {}, defaulting to OTHER", request.getType(), incidentId);
            }
        } else {
            evidence.setType(EvidenceType.OTHER);
        }

        evidence = evidenceRepository.save(evidence);

        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setUpdatedAt(LocalDateTime.now());
        update.setUpdatedBy(officer.getUser());
        update.setNotes("Added evidence: " + request.getDescription());
        update.setContent("Evidence added: " + request.getDescription());
        update.setStatus(incident.getStatus());

        update = incidentUpdateRepository.save(update);

        if (incident.getUpdates() == null) {
            incident.setUpdates(new HashSet<>());
        }
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        return mapToIncidentResponse(savedIncident);
    }

    /**
     * Reassigns an incident to another officer.
     *
     * @param incidentId      The ID of the incident.
     * @param currentOfficerId The ID of the current officer.
     * @param newOfficerId    The ID of the officer to reassign to.
     * @param notes           Additional notes for the reassignment.
     * @return Updated IncidentResponse.
     */
    @Override
    @Transactional
    public IncidentResponse assignToOtherOfficer(Long incidentId, Long currentOfficerId, Long newOfficerId, String notes) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(currentOfficerId, "Current officer ID cannot be null");
        validateNotNull(newOfficerId, "New officer ID cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, currentOfficerId);
        Officer newOfficer = officerRepository.findById(newOfficerId)
                .orElseThrow(() -> new ResourceNotFoundException("New officer not found with id: " + newOfficerId));
        Officer currentOfficer = officerRepository.findById(currentOfficerId)
                .orElseThrow(() -> new ResourceNotFoundException("Current officer not found with id: " + currentOfficerId));

        if (!incident.getReportedBy().getId().equals(currentOfficer.getUser().getId())) {
            incident.getAssignedOfficers().remove(currentOfficer);
        }

        if (incident.getAssignedOfficers().stream().noneMatch(o -> o.getId().equals(newOfficerId))) {
            incident.getAssignedOfficers().add(newOfficer);
        }

        String updateMsg = String.format("Incident reassigned from officer %s to %s",
                currentOfficer.getUser().getName(), newOfficer.getUser().getName());
        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setStatus(incident.getStatus());
        update.setNotes(notes != null && !notes.isEmpty() ? notes : updateMsg);
        update.setContent(updateMsg);
        update.setUpdatedAt(LocalDateTime.now());
        update.setUpdatedBy(currentOfficer.getUser());

        update = incidentUpdateRepository.save(update);

        if (incident.getUpdates() == null) {
            incident.setUpdates(new HashSet<>());
        }
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        try {
            sendIncidentNotification(
                    newOfficer.getUser(),
                    "You've been assigned to incident: " + incident.getTitle(),
                    "INCIDENT_ASSIGNED"
            );
        } catch (Exception e) {
            log.error("Failed to send reassignment notification for incident {}", incidentId, e);
        }

        return mapToIncidentResponse(savedIncident);
    }

    /**
     * Retrieves the timeline of events for an incident.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer requesting the timeline.
     * @return List of IncidentTimelineResponse objects.
     */
    @Override
    @Transactional(readOnly = true)
    public List<IncidentTimelineResponse> getIncidentTimeline(Long incidentId, Long officerId) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");

        Incident incident = getIncidentAndVerifyOfficer(incidentId, officerId);
        List<IncidentTimelineResponse> timeline = new ArrayList<>();

        timeline.add(IncidentTimelineResponse.builder()
                .timestamp(incident.getCreatedAt())
                .eventType("INCIDENT_CREATED")
                .description("Incident created")
                .performedBy(incident.getReportedBy().getName())
                .details("Incident reported as: " + incident.getTitle())
                .build());

        if (incident.getUpdates() != null) {
            incident.getUpdates().forEach(update -> timeline.add(IncidentTimelineResponse.builder()
                    .timestamp(update.getUpdatedAt())
                    .eventType("STATUS_UPDATE")
                    .description(update.getContent() != null ? update.getContent() : "Status changed to " + update.getStatus())
                    .performedBy(update.getUpdatedBy() != null ? update.getUpdatedBy().getName() : "System")
                    .newStatus(update.getStatus())
                    .details(update.getNotes())
                    .build()));
        }

        List<Evidence> evidenceList = evidenceRepository.findByIncidentId(incidentId);
        evidenceList.forEach(evidence -> timeline.add(IncidentTimelineResponse.builder()
                .timestamp(evidence.getUploadedAt())
                .eventType("EVIDENCE_ADDED")
                .description("Evidence added: " + evidence.getType())
                .performedBy(evidence.getUploadedBy().getName())
                .details(evidence.getDescription())
                .build()));

        timeline.sort(Comparator.comparing(IncidentTimelineResponse::getTimestamp));
        return timeline;
    }

    /**
     * Retrieves a list of available officers for assignment to an incident.
     *
     * @param incidentId        The ID of the incident.
     * @param requestingOfficerId The ID of the officer requesting the list.
     * @return List of OfficerSummary DTOs.
     */
    @Override
    @Transactional(readOnly = true)
    public List<OfficerSummary> getAvailableOfficers(Long incidentId, Long requestingOfficerId) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(requestingOfficerId, "Requesting officer ID cannot be null");
        validateOfficerExists(requestingOfficerId);

        // Verify the requesting officer has access to the incident
        if (!incidentRepository.existsByIdAndAssignedOfficersId(incidentId, requestingOfficerId)) {
            throw new AccessDeniedException("You don't have permission to view this incident");
        }

        List<Officer> availableOfficers = incidentRepository.findAvailableOfficersForIncident(
            incidentId, 
            requestingOfficerId
        );

        return availableOfficers.stream()
                .map(this::mapOfficerToSummary)
                .collect(Collectors.toList());
    }
    
    private OfficerSummary mapOfficerToSummary(Officer officer) {
        if (officer == null) {
            return null;
        }
        return OfficerSummary.builder()
            .id(officer.getId())
            .fullName(officer.getUser() != null ? officer.getUser().getName() : "Unknown")
            .badgeNumber(officer.getBadgeNumber())
            .email(officer.getUser() != null ? officer.getUser().getEmail() : null)
            .department(officer.getDepartment())
            .rank(officer.getRank() != null ? officer.getRank().name() : null)
            .build();
    }

    /**
     * Retrieves performance statistics for an officer.
     *
     * @param officerId The ID of the officer.
     * @return Map containing performance metrics.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOfficerPerformanceStats(Long officerId) {
        validateNotNull(officerId, "Officer ID cannot be null");
        validateOfficerExists(officerId);

        List<Incident> incidents = incidentRepository.findByAssignedOfficersId(officerId);

        Map<IncidentStatus, Long> statusCounts = incidents.stream()
                .collect(Collectors.groupingBy(Incident::getStatus, Collectors.counting()));

        Map<IncidentPriority, Long> priorityCounts = incidents.stream()
                .collect(Collectors.groupingBy(Incident::getPriority, Collectors.counting()));

        double avgResolutionTimeHours = incidents.stream()
                .filter(i -> i.getStatus() == IncidentStatus.RESOLVED && i.getResolutionDate() != null)
                .mapToLong(i -> Duration.between(i.getCreatedAt(), i.getResolutionDate()).toHours())
                .average()
                .orElse(0.0);

        long totalResolved = statusCounts.getOrDefault(IncidentStatus.RESOLVED, 0L) +
                statusCounts.getOrDefault(IncidentStatus.CLOSED, 0L);
        double resolutionRate = incidents.isEmpty() ? 0.0 : (totalResolved * 100.0) / incidents.size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalIncidents", (long) incidents.size());
        stats.put("statusCounts", statusCounts);
        stats.put("priorityCounts", priorityCounts);
        stats.put("resolvedIncidents", totalResolved);
        stats.put("resolutionRate", Math.round(resolutionRate * 100.0) / 100.0);
        stats.put("avgResolutionTimeHours", Math.round(avgResolutionTimeHours * 100.0) / 100.0);

        return stats;
    }

    /**
     * Retrieves an incident and verifies that the officer is assigned to it.
     *
     * @param incidentId The ID of the incident.
     * @param officerId  The ID of the officer.
     * @return The Incident entity.
     * @throws ResourceNotFoundException if the incident is not found.
     * @throws UnauthorizedException if the officer is not assigned to the incident.
     */
    private Incident getIncidentAndVerifyOfficer(Long incidentId, Long officerId) {
        validateNotNull(incidentId, "Incident ID cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));
        verifyOfficerAssigned(incident, officerId);
        return incident;
    }

    /**
     * Verifies that an officer is assigned to an incident.
     *
     * @param incident  The incident to check.
     * @param officerId The ID of the officer.
     * @throws UnauthorizedException if the officer is not assigned to the incident.
     */
    private void verifyOfficerAssigned(Incident incident, Long officerId) {
        validateNotNull(incident, "Incident cannot be null");
        validateNotNull(officerId, "Officer ID cannot be null");

        boolean isAssigned = incident.getAssignedOfficers().stream()
                .anyMatch(officer -> officer.getId().equals(officerId));
        if (!isAssigned) {
            throw new UnauthorizedException("Officer with id " + officerId + " is not assigned to incident " + incident.getId());
        }
    }

    /**
     * Maps an Incident entity to an IncidentResponse DTO.
     *
     * @param incident The Incident entity to map.
     * @return Mapped IncidentResponse.
     */
    private IncidentResponse mapToIncidentResponse(Incident incident) {
        if (incident == null) {
            return null;
        }

        IncidentResponse response = new IncidentResponse();
        response.setId(incident.getId());
        response.setTitle(incident.getTitle());
        response.setDescription(incident.getDescription());
        response.setStatus(incident.getStatus());
        response.setPriority(incident.getPriority());
        response.setIncidentType(incident.getIncidentType());
        response.setLocation(incident.getLocation());
        response.setCreatedAt(incident.getCreatedAt());
        response.setUpdatedAt(incident.getUpdatedAt());
        response.setAnonymous(incident.isAnonymous());

        if (incident.getReportedBy() != null) {
            IncidentResponse.UserSummary reporter = new IncidentResponse.UserSummary();
            reporter.setId(incident.getReportedBy().getId());
            reporter.setName(incident.getReportedBy().getName());
            reporter.setEmail(incident.getReportedBy().getEmail());
            response.setReportedBy(reporter);
        }

        if (incident.getAssignedOfficers() != null) {
            List<IncidentResponse.OfficerSummary> officers = incident.getAssignedOfficers().stream()
                    .map(officer -> {
                        IncidentResponse.OfficerSummary summary = new IncidentResponse.OfficerSummary();
                        summary.setId(officer.getId());
                        summary.setName(officer.getUser().getName());
                        summary.setBadgeNumber(officer.getBadgeNumber());
                        summary.setRank(officer.getRank() != null ? officer.getRank().name() : null);
                        return summary;
                    })
                    .collect(Collectors.toList());
            response.setAssignedOfficers(officers);
        }

        if (incident.getImages() != null) {
            response.setImages(new ArrayList<>(incident.getImages()));
        }

        if (incident.getTags() != null) {
            response.setTags(new ArrayList<>(incident.getTags()));
        }

        return response;
    }

    /**
     * Validates that an object is not null, throwing an exception if it is.
     *
     * @param object  The object to validate.
     * @param message The error message if validation fails.
     * @throws IllegalArgumentException if the object is null.
     */
    private void validateNotNull(Object object, String message) {
        if (object == null) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Validates that an officer exists in the repository.
     *
     * @param officerId The ID of the officer.
     * @throws ResourceNotFoundException if the officer is not found.
     */
    private void validateOfficerExists(Long officerId) {
        validateNotNull(officerId, "Officer ID cannot be null");
        if (!officerRepository.existsById(officerId)) {
            throw new ResourceNotFoundException("Officer not found with id: " + officerId);
        }
    }

    /**
     * Sends a notification to a user about an incident.
     *
     * @param recipient The user to notify.
     * @param message   The notification message.
     * @param type      The notification type.
     */
    private void sendIncidentNotification(User recipient, String message, String type) {
        validateNotNull(recipient, "Recipient cannot be null");
        validateNotNull(message, "Notification message cannot be null");
        validateNotNull(type, "Notification type cannot be null");
        notificationService.createNotification(recipient, message, type);
    }
}