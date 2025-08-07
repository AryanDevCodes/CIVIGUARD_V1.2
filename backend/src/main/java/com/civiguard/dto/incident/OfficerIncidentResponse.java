package com.civiguard.dto.incident;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.civiguard.model.Incident;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.IncidentUpdate;
import com.civiguard.model.Officer;
import com.civiguard.model.User;
import com.civiguard.model.Location;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerIncidentResponse {
    private Long id;
    private String title;
    private String description;
    private IncidentStatus status;
    private IncidentPriority priority;
    private String incidentType;
    private Location location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean anonymous;
    private UserSummary reportedBy;
    private List<OfficerSummary> assignedOfficers;
    private List<String> images;
    private List<String> tags;
    private List<UpdateSummary> updates;

    public static OfficerIncidentResponse fromIncident(Incident incident) {
        if (incident == null) {
            return null;
        }

        return OfficerIncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .status(incident.getStatus())
                .priority(incident.getPriority())
                .incidentType(incident.getIncidentType())
                .location(incident.getLocation())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .anonymous(incident.isAnonymous())
                .reportedBy(mapToUserSummary(incident.getReportedBy()))
                .assignedOfficers(mapToOfficerSummaries(incident.getAssignedOfficers()))
                .images(incident.getImages() != null ? new ArrayList<>(incident.getImages()) : null)
                .tags(incident.getTags() != null ? new ArrayList<>(incident.getTags()) : null)
                .updates(mapToUpdateSummaries(incident.getUpdates()))
                .build();
    }

    private static UserSummary mapToUserSummary(User user) {
        if (user == null) {
            return null;
        }
        UserSummary summary = new UserSummary();
        summary.setId(user.getId());
        summary.setName(user.getName());
        summary.setEmail(user.getEmail());
        return summary;
    }

    private static List<OfficerSummary> mapToOfficerSummaries(Set<Officer> officers) {
        if (officers == null) {
            return null;
        }
        return officers.stream()
                .map(officer -> OfficerSummary.builder()
                        .id(officer.getId())
                        .fullName(officer.getUser() != null ? officer.getUser().getName() : "Unknown")
                        .badgeNumber(officer.getBadgeNumber())
                        .email(officer.getUser() != null ? officer.getUser().getEmail() : null)
                        .department(officer.getDepartment())
                        .rank(officer.getRank() != null ? officer.getRank().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private static List<UpdateSummary> mapToUpdateSummaries(Set<IncidentUpdate> updates) {
        if (updates == null) {
            return null;
        }
        return updates.stream()
                .map(update -> UpdateSummary.builder()
                        .id(update.getId())
                        .content(update.getContent())
                        .status(update.getStatus())
                        .updatedAt(update.getUpdatedAt())
                        .updatedByName(update.getUpdatedBy() != null ? update.getUpdatedBy().getName() : "System")
                        .build())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSummary {
        private Long id;
        private String content;
        private IncidentStatus status;
        private LocalDateTime updatedAt;
        private String updatedByName;
    }
}