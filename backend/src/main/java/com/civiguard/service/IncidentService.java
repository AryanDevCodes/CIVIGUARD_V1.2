package com.civiguard.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.hibernate.Hibernate; // <-- For explicit initialization
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.civiguard.dto.ReportDetailsDTO;
import com.civiguard.dto.incident.AnonymousIncidentRequest;
import com.civiguard.dto.incident.CategoryCountDto;
import com.civiguard.dto.incident.IncidentRequest;
import com.civiguard.dto.incident.UpdateIncidentRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.dto.incident.MonthlyIncidentStats;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.exception.UnauthorizedException;
import com.civiguard.model.Incident;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.IncidentUpdate;
import com.civiguard.model.Location;
import com.civiguard.model.Officer;
import com.civiguard.model.User;
import com.civiguard.repository.IncidentRepository;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private static final Logger logger = LoggerFactory.getLogger(IncidentService.class);
    
    private final OfficerRepository officerRepository;
    private final NotificationService notificationService;

    @Value("${app.incident.anonymous-reporting-enabled:true}")
    private boolean anonymousReportingEnabled;

    @Value("${app.incident.auto-close-days:7}")
    private int autoCloseDays;


    /**
     * Creates a new incident from the provided request.
     * 
     * @param request The incident request containing incident details
     * @param userId The ID of the user creating the incident
     * @param officerIds Set of officer IDs to assign to the incident
     * @return The created incident response
     */
    @Transactional
    public IncidentResponse createIncident(IncidentRequest request, Long userId, Set<Long> officerIds) {
        // Validate input parameters
        if (request == null) {
            throw new IllegalArgumentException("Incident request cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        // Find the user creating the incident
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Create and populate the incident
        Incident incident = new Incident();
        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setLocation(request.getLocation());
        incident.setReportedBy(user);
        incident.setPriority(request.getPriority());
        incident.setIncidentType(request.getIncidentType());
        incident.setTags(new HashSet<>(request.getTags()));
        incident.setStatus(IncidentStatus.REPORTED);

        // Initialize report details with current timestamp
        LocalDateTime now = LocalDateTime.now();
        Incident.ReportDetails reportDetails = new Incident.ReportDetails();
        reportDetails.setReportDate(now.toLocalDate().toString());
        reportDetails.setReportTime(now.toLocalTime().toString());
        
        // Set the report ID and details if this incident is created from a report
        if (request.getReportId() != null) {
            // Store the report ID
            incident.setReportId(request.getReportId());
            
            // Store report details if available
            if (request.getReportDetails() != null) {
                reportDetails.setWitnesses(request.getReportDetails().getWitnesses());
                reportDetails.setEvidence(request.getReportDetails().getEvidence());
                reportDetails.setOriginalDescription(request.getReportDetails().getOriginalDescription());
                reportDetails.setOriginalType(request.getReportDetails().getOriginalType());
                reportDetails.setOriginalStatus(request.getReportDetails().getOriginalStatus());
                reportDetails.setConversionNotes(request.getReportDetails().getConversionNotes());
            }
        } else {
            // For non-report-based incidents, set some default conversion notes
            reportDetails.setConversionNotes("Incident created directly without a report");
        }
        
        incident.setReportDetails(reportDetails);


        // Save the incident first to get an ID
        Incident savedIncident = incidentRepository.save(incident);

        // Assign officers if any
        if (officerIds != null && !officerIds.isEmpty()) {
            assignOfficersToIncident(savedIncident.getId(), new ArrayList<>(officerIds));
        }

        // Notify administrators about the new incident
        notificationService.notifyAdminsNewIncident(savedIncident);

        log.info("Created new incident #{} from user #{}", savedIncident.getId(), userId);
        return mapToResponse(savedIncident);
    }

    @Transactional
    public void assignOfficers(Long incidentId, Set<Long> officerIds, Long assignedByUserId) {
        // Delegate to the existing method that takes a List
        assignOfficersToIncident(incidentId, new ArrayList<>(officerIds));
    }

    @Transactional
    public IncidentResponse createAnonymousIncident(AnonymousIncidentRequest request, User createdBy) {
        if (!anonymousReportingEnabled) {
            throw new UnauthorizedException("Anonymous reporting is not enabled");
        }

        // Create new incident and set basic information
        Incident newIncident = new Incident();
        newIncident.setTitle(request.getTitle());
        newIncident.setDescription(request.getDescription());
        newIncident.setLocation(request.getLocation());
        newIncident.setAnonymous(true);
        
        // Set the user who is converting the report to an incident (admin/officer)
        newIncident.setConvertedBy(createdBy);
        
        // Set the original reporter (if available)
        if (request.getReportedBy() != null) {
            newIncident.setReportedBy(request.getReportedBy());
            if (!request.isAnonymous()) {
                newIncident.setReporterContactInfo(request.getReportedBy().getEmail());
            } else if (request.getReporterContactInfo() != null) {
                newIncident.setReporterContactInfo(request.getReporterContactInfo());
            }
        } else {
            // If no reportedBy is set, use the creator as reporter
            newIncident.setReportedBy(createdBy);
            if (request.getReporterContactInfo() != null) {
                newIncident.setReporterContactInfo(request.getReporterContactInfo());
            }
        }
        newIncident.setPriority(request.getPriority());
        newIncident.setIncidentType(request.getIncidentType());
        newIncident.setTags(new HashSet<>(request.getTags()));
        newIncident.setStatus(IncidentStatus.REPORTED);
        
        // Initialize report details with current timestamp
        LocalDateTime now = LocalDateTime.now();
        Incident.ReportDetails reportDetails = new Incident.ReportDetails();
        // Set the date and time as strings in the format expected by the frontend
        reportDetails.setReportDate(now.toLocalDate().toString());
        reportDetails.setReportTime(now.toLocalTime().toString());
        reportDetails.setConversionNotes("Anonymous incident created");
        newIncident.setReportDetails(reportDetails);

        // Save the new incident
        Incident savedIncident = incidentRepository.save(newIncident);

        // Notify administrators about the new anonymous incident
        notificationService.notifyAdminsNewIncident(savedIncident);

        return mapToResponse(savedIncident);
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
        // Eagerly initialize lazy collections
        Hibernate.initialize(incident.getTags());
        Hibernate.initialize(incident.getAssignedOfficers());
        Hibernate.initialize(incident.getImages());
        Hibernate.initialize(incident.getUpdates());
        return mapToResponse(incident);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getAllIncidents(
            String type, IncidentStatus status, IncidentPriority priority,
            String district, LocalDateTime startDate, LocalDateTime endDate,
            Pageable pageable) {

        Specification<Incident> spec = Specification.where(null);

        if (type != null && !type.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("incidentType"), type));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }

        if (district != null && !district.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("location").get("district"), district));
        }

        if (startDate != null && endDate != null) {
            spec = spec.and((root, query, cb) -> cb.between(root.get("reportDate"), startDate, endDate));
        } else if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("reportDate"), startDate));
        } else if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("reportDate"), endDate));
        }

        // Eagerly fetch images to avoid LazyInitializationException
        Page<Incident> page = incidentRepository.findAll(spec, pageable);
        // Eagerly initialize lazy collections for each incident
        for (Incident incident : page.getContent()) {
            Hibernate.initialize(incident.getTags());
            Hibernate.initialize(incident.getAssignedOfficers());
            Hibernate.initialize(incident.getImages());
            Hibernate.initialize(incident.getUpdates());
        }
        return page.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getIncidentsByUser(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Page<Incident> page = incidentRepository.findByReportedBy(user, pageable);
        // Eagerly initialize lazy collections for each incident
        for (Incident incident : page.getContent()) {
            Hibernate.initialize(incident.getTags());
            Hibernate.initialize(incident.getAssignedOfficers());
            Hibernate.initialize(incident.getImages());
            Hibernate.initialize(incident.getUpdates());
        }
        return page.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getIncidentsByOfficer(Long officerId, Pageable pageable) {
        try {
            logger.info("Fetching incidents for officer ID: {}, page: {}, size: {}", 
                officerId, pageable.getPageNumber(), pageable.getPageSize());
            
            // Verify officer exists first
            if (!officerRepository.existsById(officerId)) {
                String errorMsg = "Officer not found with ID: " + officerId;
                logger.error(errorMsg);
                throw new ResourceNotFoundException("Officer", "id", officerId);
            }
            
            // Log the count of incidents for this officer
            long incidentCount = incidentRepository.countByAssignedOfficerId(officerId);
            logger.info("Found {} total incidents for officer ID: {}", incidentCount, officerId);
            
            // Fetch the paginated results
            Page<Incident> incidents = incidentRepository.findByAssignedOfficerId(officerId, pageable);
            
            // Log the results
            logger.info("Successfully retrieved {} out of {} incidents for officer ID: {}", 
                incidents.getNumberOfElements(), incidentCount, officerId);
                
            // Map to response DTOs
            return incidents.map(incident -> {
                try {
                    return mapToResponse(incident);
                } catch (Exception e) {
                    logger.error("Error mapping incident ID: {} - {}", incident.getId(), e.getMessage(), e);
                    throw new RuntimeException("Error processing incident data", e);
                }
            });
            
        } catch (ResourceNotFoundException e) {
            // Re-throw resource not found exceptions
            throw e;
        } catch (Exception e) {
            // Log the full stack trace for other exceptions
            String errorMsg = String.format("Error fetching incidents for officer ID: %s - %s", 
                officerId, e.getMessage());
            logger.error(errorMsg, e);
            throw new RuntimeException(errorMsg, e);
        }
    }

    @Transactional
    public IncidentResponse updateIncidentStatus(Long id, IncidentStatus status, String notes, Long userId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        incident.setStatus(status);

        if (status == IncidentStatus.RESOLVED || status == IncidentStatus.CLOSED) {
            incident.setResolutionDate(LocalDateTime.now());
            incident.setResolutionNotes(notes);
        }

        // Add an update record
        IncidentUpdate update = new IncidentUpdate();
        update.setContent("Status changed to " + status + (notes != null ? ": " + notes : ""));
        update.setIncident(incident);
        update.setUpdatedBy(user);
        incident.getUpdates().add(update);

        Incident savedIncident = incidentRepository.save(incident);

        // Notify the reporter if not anonymous
        if (!incident.isAnonymous() && incident.getReportedBy() != null) {
            notificationService.notifyUserIncidentStatusChanged(savedIncident);
        }

        return mapToResponse(savedIncident);
    }

    @Transactional
    public IncidentResponse assignOfficersToIncident(Long id, List<Long> officerIds) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));

        List<Officer> officers = officerRepository.findAllById(officerIds);
        if (officers.size() != officerIds.size()) {
            throw new ResourceNotFoundException("One or more officers not found");
        }

        incident.setAssignedOfficers(officers.stream().collect(Collectors.toSet()));
        Incident savedIncident = incidentRepository.save(incident);

        // Notify assigned officers
        notificationService.notifyOfficersAssigned(savedIncident, officers);

        return mapToResponse(savedIncident);
    }

    public IncidentResponse mapToResponse(Incident incident) {
        IncidentResponse response = new IncidentResponse();
        response.setId(incident.getId());
        response.setTitle(incident.getTitle());
        response.setDescription(incident.getDescription());
        response.setLocation(incident.getLocation());

        if (!incident.isAnonymous() && incident.getReportedBy() != null) {
            IncidentResponse.UserSummary userSummary = new IncidentResponse.UserSummary();
            userSummary.setId(incident.getReportedBy().getId());
            userSummary.setName(incident.getReportedBy().getName());
            userSummary.setEmail(incident.getReportedBy().getEmail());
            response.setReportedBy(userSummary);
        }

        response.setAnonymous(incident.isAnonymous());
        response.setReporterContactInfo(incident.getReporterContactInfo());
        response.setStatus(incident.getStatus());
        response.setPriority(incident.getPriority());
        response.setIncidentType(incident.getIncidentType());
        response.setImages(new ArrayList<>(incident.getImages()));
        response.setTags(new ArrayList<>(incident.getTags()));
        response.setResolutionDate(incident.getResolutionDate());
        response.setResolutionNotes(incident.getResolutionNotes());
        response.setCreatedAt(incident.getCreatedAt());
        response.setUpdatedAt(incident.getUpdatedAt());
        
        // Set report details (always create at least a basic one with the report date)
        ReportDetailsDTO reportDetails = new ReportDetailsDTO();
        if (incident.getReportDetails() != null) {
            reportDetails.setWitnesses(incident.getReportDetails().getWitnesses());
            reportDetails.setEvidence(incident.getReportDetails().getEvidence());
            reportDetails.setReportDate(incident.getReportDetails().getReportDate());
            reportDetails.setReportTime(incident.getReportDetails().getReportTime());
            reportDetails.setOriginalDescription(incident.getReportDetails().getOriginalDescription());
            reportDetails.setOriginalType(incident.getReportDetails().getOriginalType());
            reportDetails.setOriginalStatus(incident.getReportDetails().getOriginalStatus());
            reportDetails.setConversionNotes(incident.getReportDetails().getConversionNotes());
        } else {
            // If no report details exist, set some defaults
            reportDetails.setReportDate(LocalDate.now().toString());
            reportDetails.setReportTime(LocalTime.now().toString());
            reportDetails.setConversionNotes("No report details available");
        }
        response.setReportDetails(reportDetails);
        
        // For backward compatibility, set the report date in the response
        try {
            if (incident.getReportDetails() != null && incident.getReportDetails().getReportDate() != null) {
                LocalDate reportDate = LocalDate.parse(incident.getReportDetails().getReportDate());
                LocalTime reportTime = incident.getReportDetails().getReportTime() != null ? 
                    LocalTime.parse(incident.getReportDetails().getReportTime()) : LocalTime.MIDNIGHT;
                // Set the report date using the deprecated setter for backward compatibility
                response.setReportDate(LocalDateTime.of(reportDate, reportTime));
            }
        } catch (Exception e) {
            log.warn("Error parsing report date/time: {}", e.getMessage());
            response.setReportDate(LocalDateTime.now());
        }

        // Map assigned officers
        if (incident.getAssignedOfficers() != null) {
            List<IncidentResponse.OfficerSummary> officerSummaries = incident.getAssignedOfficers().stream()
                    .map(officer -> {
                        IncidentResponse.OfficerSummary summary = new IncidentResponse.OfficerSummary();
                        summary.setId(officer.getId());
                        summary.setName(officer.getName());
                        summary.setBadgeNumber(officer.getBadgeNumber());
                        summary.setRank(officer.getRank().name());
                        return summary;
                    })
                    .collect(Collectors.toList());
            response.setAssignedOfficers(officerSummaries);
        }

        // Map updates
        if (incident.getUpdates() != null) {
            List<IncidentResponse.IncidentUpdateResponse> updateResponses = incident.getUpdates().stream()
                    .map(update -> {
                        IncidentResponse.IncidentUpdateResponse updateResponse = new IncidentResponse.IncidentUpdateResponse();
                        updateResponse.setId(update.getId());
                        updateResponse.setContent(update.getContent());
                        updateResponse.setCreatedAt(update.getCreatedAt());

                        if (update.getUpdatedBy() != null) {
                            IncidentResponse.UserSummary userSummary = new IncidentResponse.UserSummary();
                            userSummary.setId(update.getUpdatedBy().getId());
                            userSummary.setName(update.getUpdatedBy().getName());
                            userSummary.setEmail(update.getUpdatedBy().getEmail());
                            updateResponse.setUpdatedBy(userSummary);
                        }

                        return updateResponse;
                    })
                    .collect(Collectors.toList());
            response.setUpdates(updateResponses);
        }
        
        return response;
    }

    public List<MonthlyIncidentStats> getMonthlyIncidentStats() {
        List<Object[]> stats = incidentRepository.countIncidentsByMonthAndStatus();
        Map<String, MonthlyIncidentStats> statsMap = new HashMap<>();
        
        for (Object[] row : stats) {
            String month = (String) row[0];
            String status = ((Enum<?>) row[1]).name();
            Long count = ((Number) row[2]).longValue();
            
            MonthlyIncidentStats monthlyStats = statsMap.computeIfAbsent(month, k -> new MonthlyIncidentStats());
            monthlyStats.setMonth(month);
            
            switch (status) {
                case "REPORTED" -> monthlyStats.setReported(count);
                case "UNDER_INVESTIGATION" -> monthlyStats.setUnderInvestigation(count);
                case "RESOLVED" -> monthlyStats.setResolved(count);
                case "CLOSED" -> monthlyStats.setClosed(count);
            }
        }
        
        return new ArrayList<>(statsMap.values());
    }

    public List<CategoryCountDto> getIncidentTypeStats() {
        List<Object[]> results = incidentRepository.countByIncidentType();
        List<CategoryCountDto> dtos = new java.util.ArrayList<>();
        for (Object[] row : results) {
            dtos.add(new CategoryCountDto((String) row[0], (Long) row[1]));
        }
        return dtos;
    }
@Transactional
public IncidentResponse updateIncident(Long id, UpdateIncidentRequest request, Long userId) {
    // Validate input
    if (id == null) {
        throw new IllegalArgumentException("Incident ID cannot be null");
    }
    if (request == null) {
        throw new IllegalArgumentException("Update request cannot be null");
    }

    // Find the incident
    Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));

    // Check if the incident can be modified
    if (incident.getStatus() == IncidentStatus.CLOSED || incident.getStatus() == IncidentStatus.RESOLVED) {
        throw new IllegalStateException("Cannot update a " + incident.getStatus() + " incident");
    }

    // Get the user making the update
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

    // Track changes for audit log
    Map<String, String> changes = new HashMap<>();
    
    // Handle status update
    if (request.getStatus() != null && incident.getStatus() != request.getStatus()) {
        changes.put("status", request.getStatus().name());
        incident.setStatus(request.getStatus());
        
        // Add a status update to the incident history
        IncidentUpdate statusUpdate = new IncidentUpdate();
        statusUpdate.setContent("Status changed to " + request.getStatus() + 
            (request.getNotes() != null ? ": " + request.getNotes() : ""));
        statusUpdate.setIncident(incident);
        statusUpdate.setUpdatedBy(user);
        incident.getUpdates().add(statusUpdate);
    }
    
    // Handle priority update
    if (request.getPriority() != null && incident.getPriority() != request.getPriority()) {
        changes.put("priority", request.getPriority().name());
        incident.setPriority(request.getPriority());
    }
    
    // Handle assigned officers update
    if (request.getAssignedOfficerIds() != null) {
        Set<Long> newOfficerIds = new HashSet<>(request.getAssignedOfficerIds());
        Set<Long> currentOfficerIds = incident.getAssignedOfficers().stream()
                .map(Officer::getId)
                .collect(Collectors.toSet());
                
        if (!newOfficerIds.equals(currentOfficerIds)) {
            List<Officer> newOfficers = officerRepository.findAllById(newOfficerIds);
            incident.getAssignedOfficers().clear();
            incident.getAssignedOfficers().addAll(newOfficers);
            changes.put("assignedOfficers", "Assigned officers updated");
        }
    }
    
    // Handle evidence images update
    if (request.getEvidenceUrls() != null) {
        // Replace all existing images with the new ones
        incident.getImages().clear();
        incident.getImages().addAll(request.getEvidenceUrls());
        changes.put("images", "Evidence images updated");
    }
    
    // Only create a generic update record if there are changes but no specific update was created
    if (!changes.isEmpty() && (request.getStatus() == null || changes.size() > 1)) {
        IncidentUpdate update = new IncidentUpdate();
        update.setContent("Incident updated: " + String.join(", ", changes.keySet()));
        update.setIncident(incident);
        update.setUpdatedBy(user);
        incident.getUpdates().add(update);
    }
    
    // Add a note if provided and no other update was created
    if (request.getNotes() != null && !request.getNotes().trim().isEmpty() && 
            (request.getStatus() == null || !changes.containsKey("status"))) {
        IncidentUpdate noteUpdate = new IncidentUpdate();
        noteUpdate.setContent("Note added: " + request.getNotes());
        noteUpdate.setIncident(incident);
        noteUpdate.setUpdatedBy(user);
        incident.getUpdates().add(noteUpdate);
    }

    Incident savedIncident = incidentRepository.save(incident);
    
    // Notify relevant users about the update
    // if (!incident.isAnonymous() && incident.getReportedBy() != null) {
    //     notificationService.notifyUserIncidentUpdated(savedIncident);
    // }

    return mapToResponse(savedIncident);
}

@Transactional
public void deleteIncident(Long id) {
    if (id == null) {
        throw new IllegalArgumentException("Incident ID cannot be null");
    }

    Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));

    // Prevent deletion of incidents that are under investigation or have been resolved
    if (incident.getStatus() == IncidentStatus.UNDER_INVESTIGATION || 
        incident.getStatus() == IncidentStatus.RESOLVED) {
        throw new IllegalStateException(
            String.format("Cannot delete incident with status: %s", incident.getStatus())
        );
    }

    // Log the deletion attempt
    log.info("Deleting incident with ID: {}, Title: {}", id, incident.getTitle());

    try {
        // Clear relationships
        incident.getTags().clear();
        incident.getAssignedOfficers().clear();
        incident.getImages().clear();
        
        // Clear updates and set a final update
        IncidentUpdate finalUpdate = new IncidentUpdate();
        finalUpdate.setContent("Incident has been deleted");
        finalUpdate.setIncident(incident);
        incident.getUpdates().clear();
        incident.getUpdates().add(finalUpdate);
        
        // Save to update relationships
        incident = incidentRepository.save(incident);
        
        // Now delete the incident
        incidentRepository.delete(incident);
        
        log.info("Successfully deleted incident with ID: {}", id);
    } catch (Exception e) {
        log.error("Error deleting incident with ID: " + id, e);
        throw new RuntimeException("Failed to delete incident: " + e.getMessage(), e);
    }
}

/**
 * Find an incident by its associated report ID
 * @param reportId The ID of the report to find the incident for
 * @return Optional containing the incident if found, empty otherwise
 */
@Transactional(readOnly = true)
public Optional<Incident> getIncidentByReportId(Long reportId) {
    if (reportId == null) {
        return Optional.empty();
    }
    // Since Incident has a reference to Report, we need to find the Incident that references this report
    return incidentRepository.findAll().stream()
            .filter(incident -> incident.getReport() != null && reportId.equals(incident.getReport().getId()))
            .findFirst();
}
}
