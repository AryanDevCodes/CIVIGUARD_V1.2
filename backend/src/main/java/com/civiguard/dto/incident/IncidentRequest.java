
package com.civiguard.dto.incident;

import com.civiguard.dto.ReportDetailsDTO;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating or updating an incident.
 * Includes a reference to the source report if the incident was created from a report.
 */
@Data
public class IncidentRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must be less than 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    private Location location;

    private IncidentPriority priority = IncidentPriority.MEDIUM;

    @NotBlank(message = "Incident type is required")
    private String incidentType;

    /**
     * ID of the report this incident was created from, if any.
     * This is used to maintain a relationship between incidents and their source reports.
     */
    @Positive(message = "Report ID must be a positive number")
    private Long reportId;

    /**
     * Tags to categorize the incident.
     */
    private List<String> tags = new ArrayList<>();

    /**
     * IDs of officers assigned to this incident.
     */
    private List<Long> assignedOfficerIds = new ArrayList<>();
    
    /**
     * The user who originally reported the incident (citizen).
     * This is different from the user who created the incident (admin/officer).
     */
    private com.civiguard.model.User reportedBy;

    /**
     * Details from the original report when this incident was created from a report.
     * This includes all the original report data for reference.
     */
    private ReportDetailsDTO reportDetails;

    public List<Long> getAssignedOfficerIds() {
        return assignedOfficerIds;
    }

    public void setAssignedOfficerIds(List<Long> assignedOfficerIds) {
        this.assignedOfficerIds = assignedOfficerIds != null ? assignedOfficerIds : new ArrayList<>();
    }
}
