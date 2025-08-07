package com.civiguard.model;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"updates", "assignedOfficers", "reportDetails"})
@EqualsAndHashCode(exclude = {"updates", "assignedOfficers", "reportDetails"})
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id",
    scope = Incident.class
)
public class Incident {
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportDetails {
        @Column(columnDefinition = "TEXT")
        private String witnesses;
        
        @Column(columnDefinition = "TEXT")
        private String evidence;
        
        private String reportDate;
        private String reportTime;
        
        @Column(columnDefinition = "TEXT")
        private String originalDescription;
        
        private String originalType;
        
        @Enumerated(EnumType.STRING)
        private Report.ReportStatus originalStatus;
        
        @Column(length = 1000)
        private String conversionNotes;
        
        // Additional setters for compatibility
        public void setReportDate(String reportDate) {
            this.reportDate = reportDate;
        }
        
        public void setReportTime(String reportTime) {
            this.reportTime = reportTime;
        }
        
        public void setConversionNotes(String conversionNotes) {
            this.conversionNotes = conversionNotes;
        }
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;
    
    public String getTitle() {
        return title;
    }

    @Column(nullable = false, length = 2000)
    private String description;
    
    public String getDescription() {
        return description;
    }

    @Embedded
    private Location location;
    
    public Location getLocation() {
        return location;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id")
    private User reportedBy;
    
    public User getReportedBy() {
        return reportedBy;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_by_id")
    private User convertedBy;

    private boolean isAnonymous = false;
    
    public boolean isAnonymous() {
        return isAnonymous;
    }

    private String reporterContactInfo;
    
    public String getReporterContactInfo() {
        return reporterContactInfo;
    }

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "incident_officers",
        joinColumns = @JoinColumn(name = "incident_id"),
        inverseJoinColumns = @JoinColumn(name = "officer_id")
    )
    private Set<Officer> assignedOfficers = new HashSet<>();
    
    public Set<Officer> getAssignedOfficers() {
        return assignedOfficers != null ? assignedOfficers : new HashSet<>();
    }

    @Enumerated(EnumType.STRING)
    private IncidentStatus status = IncidentStatus.REPORTED;
    
    public IncidentStatus getStatus() {
        return status;
    }
    
    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    @Enumerated(EnumType.STRING)
    private IncidentPriority priority = IncidentPriority.MEDIUM;
    
    public IncidentPriority getPriority() {
        return priority;
    }

    @Column(nullable = false)
    private String incidentType;
    
    public String getIncidentType() {
        return incidentType;
    }

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "incident_images", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "image_url")
    @BatchSize(size = 20)
    private Set<String> images = new HashSet<>();
    
    public Set<String> getImages() {
        return images != null ? images : new HashSet<>();
    }
    
    // Additional setter for tags to maintain compatibility
    public void setTags(Set<String> tags) {
        this.tags = tags != null ? tags : new HashSet<>();
    }

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "incident_tags", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "tag")
    @BatchSize(size = 20)
    private Set<String> tags = new HashSet<>();
    
    public Set<String> getTags() {
        return tags != null ? tags : new HashSet<>();
    }

    private LocalDateTime resolutionDate;
    
    public LocalDateTime getResolutionDate() {
        return resolutionDate;
    }

    @Column(length = 2000)
    private String resolutionNotes;
    
    public String getResolutionNotes() {
        return resolutionNotes;
    }

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    @JsonManagedReference(value="incident-updates")
    private Set<IncidentUpdate> updates = new HashSet<>();
    
    public Set<IncidentUpdate> getUpdates() {
        return updates != null ? updates : new HashSet<>();
    }


    
    @OneToOne
    @JoinColumn(name = "report_id")
    private Report report;
    
    /**
     * Gets the report this incident was created from, if any.
     * @return the source report, or null if this incident wasn't created from a report
     */
    public Report getReport() {
        return report;
    }
    
    /**
     * Gets the report details as a DTO.
     * @return the report details DTO, or null if no report is associated
     */
    public com.civiguard.dto.ReportDetailsDTO getReportDetailsAsDto() {
        if (report == null) {
            return null;
        }
        
        com.civiguard.dto.ReportDetailsDTO details = new com.civiguard.dto.ReportDetailsDTO();
        details.setWitnesses(report.getWitnesses());
        details.setEvidence(report.getEvidence());
        details.setReportDate(report.getDate());
        details.setReportTime(report.getTime());
        details.setOriginalDescription(report.getDescription());
        details.setOriginalType(report.getType());
        details.setOriginalStatus(report.getStatus());
        details.setConversionNotes("Converted from report #" + report.getId());
        
        return details;
    }
    
    /**
     * ID of the report this incident was created from, if any.
     * This is a denormalized field for easier querying.
     */
    @Column(name = "report_id", insertable = false, updatable = false)
    private Long reportId;


    
    /**
     * Gets the ID of the report this incident was created from.
     * 
     * @return the report ID, or null if this incident wasn't created from a report
     */
    public Long getReportId() {
        return reportId != null ? reportId : (report != null ? report.getId() : null);
    }

    @CreationTimestamp
    private LocalDateTime createdAt;
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public ReportDetails getReportDetails() {
        return reportDetails;
    }
    
    public void setReportDetails(ReportDetails reportDetails) {
        this.reportDetails = reportDetails;
    }

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "witnesses", column = @Column(name = "report_witnesses")),
        @AttributeOverride(name = "evidence", column = @Column(name = "report_evidence")),
        @AttributeOverride(name = "reportDate", column = @Column(name = "report_date")),
        @AttributeOverride(name = "reportTime", column = @Column(name = "report_time")),
        @AttributeOverride(name = "originalDescription", column = @Column(name = "original_description")),
        @AttributeOverride(name = "originalType", column = @Column(name = "original_type")),
        @AttributeOverride(name = "originalStatus", column = @Column(name = "original_status")),
        @AttributeOverride(name = "conversionNotes", column = @Column(name = "conversion_notes"))
    })
    private ReportDetails reportDetails;

    public enum IncidentStatus {
        REPORTED, UNDER_INVESTIGATION, IN_PROGRESS, RESOLVED, CLOSED;
        
        @JsonCreator
        public static IncidentStatus fromString(String value) {
            if (value == null) return null;
            try {
                return IncidentStatus.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
    }

    public enum IncidentPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
