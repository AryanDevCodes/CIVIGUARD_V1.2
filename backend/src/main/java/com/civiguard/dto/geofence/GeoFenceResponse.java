package com.civiguard.dto.geofence;

import com.civiguard.model.GeoFence;
import com.civiguard.model.Location;
import com.civiguard.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoFenceResponse {
    private Long id;
    private String name;
    private String description;
    private GeoFence.FenceType type;
    private Double radiusKm;
    private Location center;
    private List<GeoFencePointResponse> polygonPoints;
    private GeoFence.FencePurpose purpose;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserSummary createdBy;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        
        public static UserSummary fromUser(User user) {
            if (user == null) {
                return null;
            }
            return UserSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
        }
    }
}