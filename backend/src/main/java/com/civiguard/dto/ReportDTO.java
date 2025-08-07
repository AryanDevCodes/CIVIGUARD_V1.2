package com.civiguard.dto;

import com.civiguard.model.Report;
import com.civiguard.model.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReportDTO {
    private Long id;
    private String title;
    private String description;
    private String type;
    private Report.ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;
    private String createdBy;
    private String priority;
    private String date;
    private String time;
    private String witnesses;
    private String evidence;
    private Double latitude;
    private Double longitude;

    public static ReportDTO fromEntity(Report report) {
        ReportDTO dto = new ReportDTO();
        dto.setId(report.getId());
        dto.setTitle(report.getTitle());
        dto.setDescription(report.getDescription());
        dto.setType(report.getType());
        dto.setStatus(report.getStatus());
        dto.setCreatedAt(report.getCreatedAt());
        dto.setUpdatedAt(report.getUpdatedAt());
        dto.setResolvedAt(report.getResolvedAt());
        dto.setResolutionNotes(report.getResolutionNotes());
        
        // Safely handle createdBy user
        User createdBy = report.getCreatedBy();
        if (createdBy != null) {
            dto.setCreatedBy(createdBy.getName() != null ? 
                createdBy.getName() : 
                (createdBy.getEmail() != null ? createdBy.getEmail() : "Unknown"));
        
        // Set additional fields
        dto.setPriority(report.getPriority());
        dto.setDate(report.getDate());
        dto.setTime(report.getTime());
        dto.setWitnesses(report.getWitnesses());
        dto.setEvidence(report.getEvidence());
        // Get location from the embedded Location object
        if (report.getLocation() != null) {
            dto.setLatitude(report.getLocation().getLatitude());
            dto.setLongitude(report.getLocation().getLongitude());
        }
        } else {
            dto.setCreatedBy("Unknown");
        }
        
        return dto;
    }
}
