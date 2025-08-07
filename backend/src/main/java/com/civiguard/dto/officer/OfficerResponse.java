
package com.civiguard.dto.officer;

import com.civiguard.model.Officer.OfficerStatus;
import com.civiguard.model.Officer.Rank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class OfficerResponse {
    private Long id;
    private String name;
    private String badgeNumber;
    private Rank rank;
    private String department;
    private OfficerStatus status;
    private String district;
    private LocalDate joinDate;
    private LocalDate dateOfBirth;
    private String avatar;
    private String contactNumber;
    private String email;
    private String address;
    private String emergencyContact;
    private String designation;
    private String specialization;
    private String weaponNumber;
    private String bloodGroup;
    private String currentPosting;
    private List<String> previousPostings = new ArrayList<>();
    private UserSummary user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private OfficerPerformanceResponse performance;
    
    public OfficerPerformanceResponse getPerformance() {
        return performance;
    }
    
    public void setPerformance(OfficerPerformanceResponse performance) {
        this.performance = performance;
    }
    
    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
