
package com.civiguard.dto.incident;

import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.User;
import com.civiguard.model.Location;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AnonymousIncidentRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must be less than 100 characters")
    private String title;
    
    private User reportedBy;
    private boolean anonymous = true;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    private Location location;

    private String reporterContactInfo;

    private IncidentPriority priority = IncidentPriority.MEDIUM;

    @NotBlank(message = "Incident type is required")
    private String incidentType;

    private List<String> tags = new ArrayList<>();
    
    public List<String> getTags() {
        return tags != null ? tags : new ArrayList<>();
    }
}
