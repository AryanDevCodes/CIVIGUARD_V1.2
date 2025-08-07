package com.civiguard.controller;

import com.civiguard.dto.incident.MonthlyIncidentStats;
import com.civiguard.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final IncidentService incidentService;

    @GetMapping("/incidents-monthly")
    public List<MonthlyIncidentStats> getMonthlyIncidentStats() {
        return incidentService.getMonthlyIncidentStats();
    }

    @GetMapping("/categories")
    public List<com.civiguard.dto.incident.CategoryCountDto> getIncidentsByType() {
        return incidentService.getIncidentTypeStats();
    }
}
