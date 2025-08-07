package com.civiguard.dto;

import com.civiguard.model.Report.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;

public class ReportStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ReportStatus status;
    
    private String notes;
    
    @Size(max = 10, message = "Cannot assign more than 10 officers")
    private Set<Long> officerIds = new HashSet<>();
    
    // Getters and Setters
    public ReportStatus getStatus() {
        return status;
    }
    
    public void setStatus(ReportStatus status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Set<Long> getOfficerIds() {
        return officerIds;
    }
    
    public void setOfficerIds(Set<Long> officerIds) {
        this.officerIds = officerIds != null ? officerIds : new HashSet<>();
    }
}
