package com.civiguard.dto.officer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a summary of an officer's information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerSummary {
    private Long id;
    private String fullName;
    private String badgeNumber;
    private String email;
    private String department;
    private String rank;
}