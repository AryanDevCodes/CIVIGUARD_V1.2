package com.civiguard.dto.incident;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyIncidentStats {
    private String month; // e.g. "2024-05"
    private long reported;
    private long underInvestigation;
    private long resolved;
    private long closed;
}
