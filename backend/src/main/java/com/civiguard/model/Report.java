package com.civiguard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "reports")
@Data
@EqualsAndHashCode(callSuper = false)
@JsonIgnoreProperties({"createdBy", "assignedOfficers", "hibernateLazyInitializer", "handler"})
public class Report {
    public enum ReportStatus {
        PENDING, IN_REVIEW, IN_PROGRESS, RESOLVED, REJECTED, CONVERTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String type;
    
    @Enumerated(EnumType.STRING)
    private ReportStatus status = ReportStatus.PENDING;
    
    private String priority = "MEDIUM";
    private String date;
    private String time;
    private String witnesses;
    private String evidence;
    
    @Embedded
    private Location location;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "report_officers",
        joinColumns = @JoinColumn(name = "report_id"),
        inverseJoinColumns = @JoinColumn(name = "officer_id")
    )
    private Set<Officer> assignedOfficers = new HashSet<>();
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private LocalDateTime resolvedAt;
    private String resolutionNotes;


    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Constructors
    public Report() {}

    public Report(String title, String description, String type, LocalDateTime createdAt, String status2, User createdBy) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.createdAt = createdAt;
        this.status = ReportStatus.valueOf(status2.toUpperCase());
        this.createdBy = createdBy;
    }

    public Report(String title2, String type2, LocalDateTime createdAt2, String status2, User createdBy2) {
        this.title = title2;
        this.type = type2;
        this.createdAt = createdAt2;
        this.status = ReportStatus.valueOf(status2.toUpperCase());
        this.createdBy = createdBy2;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public Set<Officer> getAssignedOfficers() { return assignedOfficers; }
    public void setAssignedOfficers(Set<Officer> officers) { this.assignedOfficers = officers; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String notes) { this.resolutionNotes = notes; }
    
    public String getWitnesses() { return witnesses; }
    public void setWitnesses(String witnesses) { this.witnesses = witnesses; }
    
    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User user) { this.createdBy = user; }

    // Helper methods
    public boolean isAssigned() {
        return !assignedOfficers.isEmpty();
    }

    public boolean isResolved() {
        return status == ReportStatus.RESOLVED || status == ReportStatus.CONVERTED;
    }
    
    public void assignOfficer(Officer officer) {
        if (officer != null) {
            this.assignedOfficers.add(officer);
        }
    }
    
    public void removeOfficer(Officer officer) {
        if (officer != null) {
            this.assignedOfficers.remove(officer);
        }
    }
    
    public boolean isAssignedToOfficer(Long officerId) {
        return assignedOfficers.stream()
            .anyMatch(officer -> officer.getId().equals(officerId));
    }
    
    public void markAsResolved(String notes) {
        this.status = ReportStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.resolutionNotes = notes;
    }
    
    public void markAsInProgress() {
        this.status = ReportStatus.IN_PROGRESS;
    }
    
    public void markAsInReview() {
        this.status = ReportStatus.IN_REVIEW;
    }
    
    public void reject(String reason) {
        this.status = ReportStatus.REJECTED;
        this.resolutionNotes = reason;
        this.resolvedAt = LocalDateTime.now();
    }
}
