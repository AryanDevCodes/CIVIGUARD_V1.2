
package com.civiguard.dto.incident;

import com.civiguard.dto.ReportDetailsDTO;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.Location;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
public class IncidentResponse {
    public void setAnonymous(boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }
    
    public void setIncidentType(String incidentType) {
        this.incidentType = incidentType;
    }
    
    public void setImages(List<String> images) {
        this.images = images != null ? new ArrayList<>(images) : new ArrayList<>();
    }
    
    public void setTags(List<String> tags) {
        this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setLocation(Location location) {
        this.location = location;
    }
    
    public void setReportedBy(UserSummary reportedBy) {
        this.reportedBy = reportedBy;
    }
    
    public void setAssignedOfficers(List<OfficerSummary> assignedOfficers) {
        this.assignedOfficers = assignedOfficers != null ? new ArrayList<>(assignedOfficers) : new ArrayList<>();
    }
    
    public void setStatus(IncidentStatus status) {
        this.status = status;
    }
    
    public void setPriority(IncidentPriority priority) {
        this.priority = priority;
    }
    
    public void setReportDate(LocalDateTime reportDate) {
        this.reportDate = reportDate;
    }
    
    public void setResolutionDate(LocalDateTime resolutionDate) {
        this.resolutionDate = resolutionDate;
    }
    
    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
    private Long id;
    private String title;
    private String description;
    private Location location;
    private UserSummary reportedBy;
    private boolean isAnonymous;
    private String reporterContactInfo;
    private List<OfficerSummary> assignedOfficers = new ArrayList<>();
    private IncidentStatus status;
    private IncidentPriority priority;
    private String incidentType;
    private List<String> images = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    @Deprecated
    private LocalDateTime reportDate; // Kept for backward compatibility, will be removed in future versions
    
    private LocalDateTime resolutionDate;
    private String resolutionNotes;
    private List<IncidentUpdateResponse> updates = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long reportId;
    
    /**
     * Details from the original report when this incident was created from a report.
     * This includes all the original report data for reference.
     */
    private ReportDetailsDTO reportDetails = new ReportDetailsDTO();
    
    /**
     * Gets the report date from either the legacy field or the report details.
     * @return the report date as LocalDateTime
     */
    public LocalDateTime getReportDate() {
        if (reportDate != null) {
            return reportDate;
        }
        if (reportDetails != null && reportDetails.getReportDate() != null) {
            try {
                LocalDate date = LocalDate.parse(reportDetails.getReportDate());
                LocalTime time = reportDetails.getReportTime() != null ? 
                    LocalTime.parse(reportDetails.getReportTime()) : LocalTime.MIDNIGHT;
                return LocalDateTime.of(date, time);
            } catch (Exception e) {
                return LocalDateTime.now();
            }
        }
        return LocalDateTime.now();
    }
    
    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }
    
    public void setAssignedOfficerIds(Set<Long> officerIds) {
        // This method is kept for backward compatibility
        // The actual assignment is handled through the assignedOfficers list
    }

    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }

    @Data
    public static class OfficerSummary {
        private Long id;
        private String name;
        private String badgeNumber;
        private String rank;
    }

    @Data
    public static class IncidentUpdateResponse {
        private Long id;
        private String content;
        private UserSummary updatedBy;
        private LocalDateTime createdAt;
    }
}
