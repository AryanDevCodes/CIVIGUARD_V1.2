package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.system.SystemLogResponse;
import com.civiguard.dto.system.SystemMetricsResponse;
import com.civiguard.dto.system.SystemStatusResponse;
import com.civiguard.service.SystemMonitoringService;
import com.civiguard.service.SystemStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class PublicSystemController {

    private final SystemStatusService systemStatusService;
    private final SystemMonitoringService systemMonitoringService;

    /**
     * Public endpoint to get the status of all system components.
     * Accessible without authentication.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<List<SystemStatusResponse>>> getAllComponentStatuses() {
        try {
            List<SystemStatusResponse> statuses = systemStatusService.getAllComponentStatuses();
            return ResponseEntity.ok(ApiResponse.success("System status retrieved successfully", statuses));
        } catch (Exception e) {
            log.error("Error getting system status", e);
            ApiResponse<List<SystemStatusResponse>> errorResponse = new ApiResponse<>();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Failed to retrieve system status: " + e.getMessage());
            errorResponse.setData(Collections.emptyList());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Get system metrics including CPU, memory, and disk usage
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<SystemMetricsResponse>> getSystemMetrics() {
        try {
            SystemMetricsResponse metrics = systemMonitoringService.getSystemMetrics();
            return ResponseEntity.ok(ApiResponse.success("System metrics retrieved successfully", metrics));
        } catch (Exception e) {
            log.error("Error getting system metrics", e);
            ApiResponse<SystemMetricsResponse> errorResponse = new ApiResponse<>();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Failed to retrieve system metrics: " + e.getMessage());
            errorResponse.setData(null);
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Get system logs with optional filtering and pagination
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<SystemLogResponse>>> getSystemLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        
        try {
            Page<SystemLogResponse> logs = systemMonitoringService.getSystemLogs(level, search, pageable);
            return ResponseEntity.ok(ApiResponse.success("System logs retrieved successfully", logs));
        } catch (Exception e) {
            log.error("Error getting system logs", e);
            ApiResponse<Page<SystemLogResponse>> errorResponse = new ApiResponse<>();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Failed to fetch system logs: " + e.getMessage());
            errorResponse.setData(Page.empty());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
