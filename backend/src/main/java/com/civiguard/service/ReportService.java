package com.civiguard.service;

import com.civiguard.dto.ReportRequest;
import com.civiguard.dto.incident.IncidentRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.exception.ReportOperationException;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Location;
import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;
import com.civiguard.model.User;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ReportRepository;
import com.civiguard.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.scheduling.annotation.Async;
import org.springframework.util.StringUtils;
import org.hibernate.Hibernate;
import com.civiguard.dto.ReportDTO;
import com.civiguard.dto.ReportDetailsDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.regex.Pattern;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.civiguard.specification.ReportSpecifications.*;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final IncidentService incidentService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Optional<ReportDTO> getReportDtoById(Long id) {
        log.info("Fetching report with ID: {}", id);
        return reportRepository.findById(id)
            .map(report -> {
                // Initialize lazy-loaded relationships
                try {
                    // Initialize createdBy user
                    if (report.getCreatedBy() != null) {
                        Hibernate.initialize(report.getCreatedBy());
                    }
                    // Initialize assigned officers
                    Hibernate.initialize(report.getAssignedOfficers());
                    
                    // Touch the collections to ensure they're loaded
                    if (report.getAssignedOfficers() != null) {
                        report.getAssignedOfficers().size();
                    }
                } catch (Exception e) {
                    log.error("Error initializing report relationships: {}", e.getMessage(), e);
                }
                return ReportDTO.fromEntity(report);
            });
    }

    @Transactional(readOnly = true)
    public Page<Report> searchReports(
            String search,
            ReportStatus status,
            String type,
            String priority,
            Long createdBy,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable) {
                
        log.debug("Searching reports with filters - search: {}, status: {}, type: {}, priority: {}, createdBy: {}, dateFrom: {}, dateTo: {}", 
                search, status, type, priority, createdBy, dateFrom, dateTo);
        
        // Get the count of matching reports
        long total = reportRepository.countReportsWithAssociations(
            search, status, type, priority, createdBy, 
            dateFrom != null ? dateFrom.atStartOfDay() : null,
            dateTo != null ? dateTo.atTime(23, 59, 59) : null
        );
        
        if (total == 0) {
            return Page.empty(pageable);
        }
        
        // Fetch the reports with required associations in a single query
        List<Report> reports = reportRepository.findReportsWithAssociations(
            search, status, type, priority, createdBy, 
            dateFrom != null ? dateFrom.atStartOfDay() : null,
            dateTo != null ? dateTo.atTime(23, 59, 59) : null,
            pageable.getPageSize(),
            (int) pageable.getOffset()
        );
        
        return new PageImpl<>(reports, pageable, total);
    }
    
    public Page<Report> getReportsByStatus(ReportStatus status, Pageable pageable) {
        log.debug("Fetching reports with status: {}", status);
        return reportRepository.findByStatus(status, pageable);
    }

    public Page<Report> searchReports(String query, ReportStatus status, Long userId, Pageable pageable) {
        log.debug("Searching reports with query: {}, status: {}, userId: {}", query, status, userId);
        Specification<Report> spec = Specification.where(null);

        if (StringUtils.hasText(query)) {
            spec = spec.and(hasTitleContaining(query))
                    .or(hasDescriptionContaining(query));
        }

        if (status != null) {
            spec = spec.and(hasStatus(status));
        }

        if (userId != null) {
            spec = spec.and(createdByUser(userId));
        }

        return reportRepository.findAll(spec, pageable);
    }

    /**
     * Get a report by its ID
     * @param id The ID of the report to retrieve
     * @return An Optional containing the report if found, or empty otherwise
     */
    public Optional<Report> getReportById(Long id) {
        return reportRepository.findById(id);
    }

    public Report getReportWithAssignedOfficers(Long id) {
        return reportRepository.findByIdWithAssignedOfficers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
    }

    public Report createReport(ReportRequest reportRequest, User user) {
        Report report = new Report();
        report.setTitle(reportRequest.getTitle());
        report.setDescription(reportRequest.getDescription());
        report.setType(reportRequest.getType());
        report.setStatus(Report.ReportStatus.PENDING);
        
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        report.setCreatedAt(now);
        report.setUpdatedAt(now);
        
        // Set date and time
        if (reportRequest.getDate() != null) {
            report.setDate(reportRequest.getDate().toString());
        }
        if (reportRequest.getTime() != null) {
            report.setTime(reportRequest.getTime());
        }
        
        // Set location
        if (reportRequest.getLocation() != null) {
            Location location = new Location();
            
            // Handle both coordinate formats (lat/lng and latitude/longitude)
            if (reportRequest.getLocation().getLat() != null && reportRequest.getLocation().getLng() != null) {
                // Handle lat/lng format
                location.setLatitude(reportRequest.getLocation().getLat());
                location.setLongitude(reportRequest.getLocation().getLng());
            } else if (reportRequest.getLocation().getLatitude() != null && reportRequest.getLocation().getLongitude() != null) {
                // Handle latitude/longitude format
                location.setLatitude(reportRequest.getLocation().getLatitude());
                location.setLongitude(reportRequest.getLocation().getLongitude());
            }
            
            // Set address if available
            String address = reportRequest.getLocation().getAddress();
            if (address == null || address.isEmpty()) {
                // If address is not provided, use locationString as fallback
                address = reportRequest.getLocationString();
            }
            
            if (address != null && !address.isEmpty()) {
                location.setAddress(address);
            } else {
                // If no address is provided, set a default one based on coordinates
                location.setAddress(String.format("Coordinates: %f, %f", 
                    location.getLatitude() != null ? location.getLatitude() : 0,
                    location.getLongitude() != null ? location.getLongitude() : 0));
            }
            
            report.setLocation(location);
            
            log.info("Set report location - lat: {}, lng: {}, address: {}", 
                location.getLatitude(), 
                location.getLongitude(), 
                location.getAddress());
        } else if (reportRequest.getLocationString() != null) {
            // Handle case where location is sent as a string
            Location location = new Location();
            location.setAddress(reportRequest.getLocationString());
            report.setLocation(location);
        }
        
        // Set other fields
        if (reportRequest.getWitnesses() != null) {
            report.setWitnesses(reportRequest.getWitnesses());
        }
        
        if (reportRequest.getEvidence() != null) {
            report.setEvidence(reportRequest.getEvidence());
        }
        
        // Set the user who created the report
        if (user != null) {
            report.setCreatedBy(user);
            
            // Set reportedBy name if not provided in the request
            if (reportRequest.getReportedBy() == null) {
                reportRequest.setReportedBy(user.getName());
            }
        } else if (reportRequest.getReportedBy() != null) {
            // If no user but reportedBy is provided, create a minimal user with just the name
            User reportedByUser = new User();
            reportedByUser.setName(reportRequest.getReportedBy());
            report.setCreatedBy(reportedByUser);
        }
        
        // Set priority if provided
        if (reportRequest.getPriority() != null) {
            report.setPriority(reportRequest.getPriority());
        }
        
        // Save the report
        Report savedReport = reportRepository.save(report);

        // Notify admins about the new report asynchronously
        if (user != null) {
            // Use a fresh user object to avoid lazy loading issues
            userRepository.findById(user.getId()).ifPresent(freshUser -> 
                sendNotificationAsync(freshUser, savedReport)
            );
        } else {
            log.info("Skipping admin notification - no authenticated user");
        }

        return savedReport;
    }
    
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotificationAsync(User user, Report report) {
        try {
            notificationService.createNotification(
                user,
                "New Report #" + report.getId() + ": " + report.getTitle(),
                "NEW_REPORT"
            );
            log.info("Notified admins about new report #{}", report.getId());
        } catch (Exception e) {
            log.error("Failed to send new report notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Converts a report to an incident with proper field mapping and note handling.
     * 
     * @param reportId The ID of the report to convert
     * @param userId The ID of the user performing the conversion
     * @param conversionNotes Optional notes about the conversion
     * @param additionalOfficerIds Set of additional officer IDs to assign to the incident
     * @return The created incident response
     * @throws ResourceNotFoundException if the report is not found
     * @throws ReportOperationException if the report cannot be converted
     */
    @Transactional
    public IncidentResponse convertToIncident(Long reportId, Long userId, String conversionNotes, Set<Long> additionalOfficerIds) {
        // 1. Validate input parameters
        if (reportId == null) {
            throw new IllegalArgumentException("Report ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (additionalOfficerIds == null) {
            additionalOfficerIds = new HashSet<>();
        }

        // 2. Fetch and validate the report
        Report report = getReportById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        // 3. Validate report can be converted
        validateReportForConversion(report);

        try {
            // 4. Create incident request from report with proper field mapping
            IncidentRequest incidentRequest = createIncidentRequestFromReport(report, conversionNotes);

            // 5. Create the incident with the assigned officers
            IncidentResponse incidentResponse = incidentService.createIncident(incidentRequest, userId, additionalOfficerIds);
            
            // 6. Get all officers to assign (existing report officers + additional officers)
            Set<Long> allOfficerIds = getAllOfficerIds(report, additionalOfficerIds);
            
            // 7. Assign all officers to the incident
            if (!allOfficerIds.isEmpty()) {
                incidentService.assignOfficers(incidentResponse.getId(), allOfficerIds, userId);
            }
            
            // 8. Update report status and link to incident
            updateReportAfterConversion(report, incidentResponse, userId, conversionNotes);
            
            // 9. Notify relevant users about the conversion
            notifyReportConverted(report, incidentResponse, userId);
            
            log.info("Successfully converted report #{} to incident #{}", reportId, incidentResponse.getId());
            return incidentResponse;
            
        } catch (Exception e) {
            String errorMsg = String.format("Failed to convert report #%d to incident: %s", 
                reportId, e.getMessage());
            log.error(errorMsg, e);
            throw new ReportOperationException(errorMsg, e);
        }
    }
    
    /**
     * Validates if a report can be converted to an incident.
     * 
     * @param report The report to validate
     * @throws ReportOperationException if the report cannot be converted
     */
    private void validateReportForConversion(Report report) {
        if (report.getStatus() == ReportStatus.CONVERTED) {
            throw new ReportOperationException("Report #" + report.getId() + " has already been converted to an incident");
        }
        if (report.getStatus() == ReportStatus.REJECTED) {
            throw new ReportOperationException("Cannot convert a rejected report to an incident");
        }
        if (report.getStatus() == null) {
            throw new ReportOperationException("Report status cannot be null");
        }
        // Add any additional validation rules here
    }
    
    /**
     * Creates an IncidentRequest from a Report with proper field mapping.
     */
    private IncidentRequest createIncidentRequestFromReport(Report report, String conversionNotes) {
        IncidentRequest request = new IncidentRequest();
        
        // Set title with report reference
        request.setTitle(StringUtils.hasText(report.getTitle()) 
            ? report.getTitle() 
            : String.format("Incident from Report #%d", report.getId()));
        
        // Map all report fields to incident fields
        request.setDescription(report.getDescription());
        request.setIncidentType(determineIncidentType(report.getType()));
        request.setPriority(determineIncidentPriority(report));
        
        // Set the original reporter (citizen who submitted the report)
        if (report.getCreatedBy() != null) {
            request.setReportedBy(report.getCreatedBy());
        }
        
        // Include conversion notes in the description
        if (StringUtils.hasText(conversionNotes)) {
            request.setDescription(request.getDescription() + "\n\nConversion Notes: " + conversionNotes);
        }
        
        // Copy location data if available
        if (report.getLocation() != null) {
            Location location = new Location();
            
            // Set coordinates if available
            if (report.getLocation().getLatitude() != null && report.getLocation().getLongitude() != null) {
                location.setLatitude(report.getLocation().getLatitude());
                location.setLongitude(report.getLocation().getLongitude());
            }
            
            // Set address components
            location.setAddress(report.getLocation().getAddress());
            location.setCity(report.getLocation().getCity());
            location.setState(report.getLocation().getState());
            location.setCountry(report.getLocation().getCountry());
            location.setPostalCode(report.getLocation().getPostalCode());
            location.setDistrict(report.getLocation().getDistrict());
            
            log.info("Setting location in incident: lat={}, lng={}, address={}", 
                location.getLatitude(), 
                location.getLongitude(), 
                location.getAddress());
                
            request.setLocation(location);
        } else {
            log.warn("No location found in report #{}", report.getId());
            
            // Try to parse coordinates from description as fallback
            parseCoordinatesFromDescription(report, request);
        }
        
        // Set the report ID to maintain the relationship
        request.setReportId(report.getId());    
        
        // Store conversion notes in the report's resolution notes
        if (StringUtils.hasText(conversionNotes)) {
            report.setResolutionNotes(conversionNotes);
        } else {
            report.setResolutionNotes("Report was converted to an incident");
        }
        
        // Add report metadata as tags for better searchability
        List<String> tags = new ArrayList<>();
        tags.add("from-report");
        tags.add("report-" + report.getId());
        if (report.getType() != null) {
            tags.add("type-" + report.getType().toLowerCase().replace(" ", "-"));
        }
        request.setTags(tags);
        
        // Create and set report details
        ReportDetailsDTO reportDetails = new ReportDetailsDTO();
        reportDetails.setWitnesses(report.getWitnesses());
        reportDetails.setEvidence(report.getEvidence());
        // Set report date and time as strings in the format expected by the DTO
        if (report.getDate() != null) {
            reportDetails.setReportDate(report.getDate().toString());
        } else {
            reportDetails.setReportDate(LocalDate.now().toString());
        }
        if (report.getTime() != null) {
            reportDetails.setReportTime(report.getTime());
        } else {
            reportDetails.setReportTime(LocalTime.now().toString());
        }
        reportDetails.setOriginalDescription(report.getDescription());
        reportDetails.setOriginalType(report.getType());
        reportDetails.setOriginalStatus(report.getStatus());
        reportDetails.setConversionNotes(conversionNotes);
        
        // Set the report details in the request
        request.setReportDetails(reportDetails);
        
        // Add original report information to the description for backward compatibility
        StringBuilder description = new StringBuilder();
        if (StringUtils.hasText(report.getDescription())) {
            description.append(report.getDescription()).append("\n\n");
        }
        
        description.append("---\n");
        description.append("Original Report Details:\n");
        description.append(String.format("- Report ID: %d\n", report.getId()));
        description.append(String.format("- Report Type: %s\n", report.getType()));
        description.append(String.format("- Report Status: %s\n", report.getStatus()));
        description.append(String.format("- Created At: %s\n", report.getCreatedAt()));
        
        if (report.getCreatedBy() != null) {
            description.append(String.format("- Reported By: %s (%s)\n", 
                report.getCreatedBy().getName(), 
                report.getCreatedBy().getEmail()));
        }
        
        if (StringUtils.hasText(conversionNotes)) {
            description.append("\nConversion Notes: ").append(conversionNotes);
        }
        
        request.setDescription(description.toString());
        
        return request;
    }
    
    /**
     * Gets all officer IDs from the report and additional officers.
     */
    private Set<Long> getAllOfficerIds(Report report, Set<Long> additionalOfficerIds) {
        Set<Long> allOfficerIds = new HashSet<>();
        
        // Add existing report officers
        if (report.getAssignedOfficers() != null) {
            allOfficerIds.addAll(report.getAssignedOfficers().stream()
                .map(officer -> officer.getId())
                .collect(Collectors.toSet()));
        }
        
        // Add additional officers
        if (additionalOfficerIds != null) {
            allOfficerIds.addAll(additionalOfficerIds);
        }
        
        return allOfficerIds;
    }
    
    /**
     * Updates the report after successful conversion to an incident.
     */
    private void updateReportAfterConversion(Report report, IncidentResponse incidentResponse, Long userId, String conversionNotes) {
        // Update report status
        report.setStatus(ReportStatus.CONVERTED);
        report.setResolvedAt(LocalDateTime.now());
        
        // Store conversion notes in the report's resolution notes
        if (StringUtils.hasText(conversionNotes)) {
            report.setResolutionNotes("Converted to Incident #" + incidentResponse.getId() + 
                "\n\nConversion Notes:\n" + conversionNotes);
        } else {
            report.setResolutionNotes("Converted to Incident #" + incidentResponse.getId());
        }
        
        // Set the user who performed the conversion
        userRepository.findById(userId).ifPresent(report::setCreatedBy);
        
        // Update timestamps
        report.setUpdatedAt(LocalDateTime.now());
        
        // Save the updated report
        reportRepository.save(report);
    }

    @Transactional
    public Report updateReportStatus(Long reportId, ReportStatus status, String notes, Long updatedByUserId) {
        Report report = getReportById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        // Validate status transition
        validateStatusTransition(report.getStatus(), status);

        // Update report status and notes
        report.setStatus(status);
        report.setUpdatedAt(LocalDateTime.now());

        if (notes != null && !notes.trim().isEmpty()) {
            report.setResolutionNotes(notes);
        }

        if (status == ReportStatus.RESOLVED || status == ReportStatus.REJECTED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        Report updatedReport = reportRepository.save(report);

        // Notify relevant users about the status change
        notifyStatusChange(updatedReport, updatedByUserId);

        log.info("Updated report #{} status to {} by user {}", reportId, status, updatedByUserId);
        return updatedReport;
    }

    @Transactional
    public Report assignOfficers(Long reportId, Set<Long> officerIds, Long assignedByUserId) {
        if (officerIds == null || officerIds.isEmpty()) {
            throw new ReportOperationException("At least one officer must be assigned");
        }

        Report report = getReportById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        // Validate report status allows assignment
        if (report.getStatus() == ReportStatus.RESOLVED ||
                report.getStatus() == ReportStatus.REJECTED ||
                report.getStatus() == ReportStatus.CONVERTED) {
            throw new ReportOperationException("Cannot assign officers to a " + report.getStatus() + " report");
        }

        Set<com.civiguard.model.Officer> officers = new HashSet<>(officerRepository.findAllById(officerIds));

        // Verify all requested officers were found
        if (officers.size() != officerIds.size()) {
            Set<Long> foundOfficerIds = officers.stream()
                    .map(com.civiguard.model.Officer::getId)
                    .collect(Collectors.toSet());

            Set<Long> missingOfficerIds = officerIds.stream()
                    .filter(id -> !foundOfficerIds.contains(id))
                    .collect(Collectors.toSet());

            throw new ResourceNotFoundException("The following officer IDs were not found: " + missingOfficerIds);
        }

        // Get current assignments to determine who was added/removed
        Set<Long> currentOfficerIds = report.getAssignedOfficers().stream()
                .map(com.civiguard.model.Officer::getId)
                .collect(Collectors.toSet());

        Set<Long> addedOfficerIds = officerIds.stream()
                .filter(id -> !currentOfficerIds.contains(id))
                .collect(Collectors.toSet());

        // Update assignments
        report.getAssignedOfficers().clear();
        report.getAssignedOfficers().addAll(officers);
        report.setUpdatedAt(LocalDateTime.now());

        Report updatedReport = reportRepository.save(report);

        // Notify newly assigned officers
        if (!addedOfficerIds.isEmpty()) {
            notifyAssignedOfficers(updatedReport, assignedByUserId, addedOfficerIds);
        }

        log.info("Assigned {} officers to report #{} by user {}", officerIds.size(), reportId, assignedByUserId);
        return updatedReport;
    }

    private void notifyStatusChange(Report report, Long updatedByUserId) {
        // Notify the reporter
        notificationService.createNotification(
                report.getCreatedBy(),
                "Report #" + report.getId() + " status updated",
                "REPORT_STATUS_UPDATED"
        );

        // Notify assigned officers
        if (report.getAssignedOfficers() != null && !report.getAssignedOfficers().isEmpty()) {
            for (com.civiguard.model.Officer officer : report.getAssignedOfficers()) {
                notificationService.createNotification(
                        officer.getUser(),
                        "Report #" + report.getId() + " status updated: " + report.getStatus(),
                        "REPORT_STATUS_UPDATED"
                );
            }
        }
    }

    private String determineIncidentType(String reportType) {
        if (reportType == null || reportType.trim().isEmpty()) {
            return "OTHER";
        }
        return reportType.toUpperCase();
    }

    private IncidentPriority determineIncidentPriority(Report report) {
        if (report.getAssignedOfficers() != null && !report.getAssignedOfficers().isEmpty()) {
            return IncidentPriority.HIGH;
        }
        return IncidentPriority.MEDIUM;
    }

    private void notifyReportConverted(Report report, IncidentResponse incident, Long convertedByUserId) {
        String notificationTitle = "Report #" + report.getId() + " converted to Incident #" + incident.getId();
        String notificationType = "REPORT_CONVERTED";
        
        try {
            // Notify the report creator
            notificationService.createNotification(
                    report.getCreatedBy(),
                    notificationTitle,
                    notificationType
            );
            log.debug("Notified report creator #{} about report #{} conversion to incident #{}", 
                    report.getCreatedBy().getId(), report.getId(), incident.getId());
        } catch (Exception e) {
            log.error("Failed to notify report creator #{} about report conversion: {}", 
                    report.getCreatedBy().getId(), e.getMessage(), e);
        }

        // Get all officer IDs assigned to the incident
        Set<Long> officerIds = new HashSet<>();
        
        // Add officers assigned to the report
        if (report.getAssignedOfficers() != null) {
            report.getAssignedOfficers().stream()
                .map(com.civiguard.model.Officer::getId)
                .forEach(officerIds::add);
        }
        
        // Add any additional officer IDs from the incident (if available in the response)
        if (incident.getAssignedOfficers() != null) {
            incident.getAssignedOfficers().stream()
                .map(IncidentResponse.OfficerSummary::getId)
                .forEach(officerIds::add);
        }
        
        // Send notifications to all unique officers
        for (Long officerId : officerIds) {
            try {
                User officerUser = userRepository.findById(officerId).orElse(null);
                if (officerUser != null) {
                    notificationService.createNotification(
                            officerUser,
                            notificationTitle,
                            notificationType
                    );
                    log.debug("Notified officer #{} about report #{} conversion to incident #{}", 
                            officerId, report.getId(), incident.getId());
                }
            } catch (Exception e) {
                log.error("Failed to notify officer #{} about report conversion: {}", 
                        officerId, e.getMessage(), e);
            }
        }
        
        // Log the conversion
        log.info("Report #{} converted to Incident #{}. Notified {} officers and the report creator.", 
                report.getId(), incident.getId(), officerIds.size());
    }

    private void validateStatusTransition(Report.ReportStatus currentStatus, Report.ReportStatus newStatus) {
        if (currentStatus == newStatus) {
            return; // No change
        }

        switch (newStatus) {
            case IN_REVIEW:
                if (currentStatus != Report.ReportStatus.PENDING) {
                    throw new ReportOperationException("Only PENDING reports can be moved to IN_REVIEW");
                }
                break;

            case IN_PROGRESS:
                if (currentStatus != Report.ReportStatus.IN_REVIEW && currentStatus != Report.ReportStatus.PENDING) {
                    throw new ReportOperationException("Only PENDING or IN_REVIEW reports can be moved to IN_PROGRESS");
                }
                break;

            case RESOLVED:
            case REJECTED:
                if (currentStatus == Report.ReportStatus.CONVERTED) {
                    throw new ReportOperationException("Cannot modify status of a CONVERTED report");
                }
                break;

            case CONVERTED:
                if (currentStatus == Report.ReportStatus.REJECTED) {
                    throw new ReportOperationException("Cannot convert a REJECTED report to an incident");
                }
                break;

            default:
                break;
        }
    }

    private void parseCoordinatesFromDescription(Report report, IncidentRequest request) {
        if (report.getDescription() == null) {
            return;
        }
        
        // Try to find coordinates in the format: "lat: 12.34, lng: 56.78" or similar
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
            "(?:lat(?:itude)?[\s:]*([+-]?\\.?\\d+(?:\\.\\d+)?))[^0-9-+.]*(?:lng|long|longitude)[\s:]*([+-]?\\.?\\d+(?:\\.\\d+)?)", 
            Pattern.CASE_INSENSITIVE);
            
        java.util.regex.Matcher matcher = pattern.matcher(report.getDescription());
        if (matcher.find()) {
            try {
                double lat = Double.parseDouble(matcher.group(1));
                double lng = Double.parseDouble(matcher.group(2));
                
                Location location = new Location();
                location.setLatitude(lat);
                location.setLongitude(lng);
                
                // If we already have a location, update it, otherwise set a new one
                if (request.getLocation() != null) {
                    request.getLocation().setLatitude(lat);
                    request.getLocation().setLongitude(lng);
                } else {
                    request.setLocation(location);
                }
                
                log.info("Extracted coordinates from description: lat={}, lng={}", lat, lng);
            } catch (NumberFormatException e) {
                log.warn("Failed to parse coordinates from description: {}", e.getMessage());
            }
        }
    }
    
    private void notifyAssignedOfficers(Report report, Long assignedByUserId, Set<Long> officerIds) {
        if (officerIds == null || officerIds.isEmpty()) {
            return;
        }

        for (Long officerId : officerIds) {
            try {
                com.civiguard.model.Officer officer = officerRepository.findById(officerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", officerId));

                notificationService.createNotification(
                        officer.getUser(),
                        String.format("New Report Assignment - #%d: %s", report.getId(), report.getTitle()),
                        "REPORT_ASSIGNED"
                );

                log.info("Assigned report #{} to officer {} by user {} at {}",
                        report.getId(),
                        officer.getId(),
                        assignedByUserId,
                        LocalDateTime.now());
            } catch (Exception e) {
                log.error("Failed to send notification to officer {}: {}", officerId, e.getMessage(), e);
            }
        }
    }
}