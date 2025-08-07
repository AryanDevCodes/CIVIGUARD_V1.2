package com.civiguard.dto.incident;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
