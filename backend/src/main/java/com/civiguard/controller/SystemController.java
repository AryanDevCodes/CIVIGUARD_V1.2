
package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.system.SystemLogResponse;
import com.civiguard.dto.system.SystemMetricsResponse;
import com.civiguard.dto.system.SystemStatusRequest;
import com.civiguard.dto.system.SystemStatusResponse;
import com.civiguard.model.SystemStatus;
import com.civiguard.service.SystemMonitoringService;
import com.civiguard.service.SystemStatusService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/admin/system")
@PreAuthorize("hasRole('ADMIN')")
public class SystemController {

    private final SystemStatusService systemStatusService;
    private final WebSocketController webSocketController;
    private final SystemMonitoringService systemMonitoringService;
    
    public SystemController(SystemStatusService systemStatusService, 
                           WebSocketController webSocketController,
                           SystemMonitoringService systemMonitoringService) {
        this.systemStatusService = systemStatusService;
        this.webSocketController = webSocketController;
        this.systemMonitoringService = systemMonitoringService;
    }

    @PutMapping("/status")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> updateComponentStatus(
            @Valid @RequestBody SystemStatusRequest request) {
        SystemStatusResponse status = systemStatusService.updateComponentStatus(request);
        // Broadcast the updated status in real-time
        webSocketController.broadcastSystemStatus(status);
        return ResponseEntity.ok(ApiResponse.success("System status updated successfully", status));
    }

    @GetMapping("/status/{componentName}")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> getComponentStatus(@PathVariable String componentName) {
        SystemStatusResponse status = systemStatusService.getComponentStatus(componentName);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<List<SystemStatusResponse>>> getAllComponentStatuses() {
        List<SystemStatusResponse> statuses = systemStatusService.getAllComponentStatuses();
        return ResponseEntity.ok(ApiResponse.success(statuses));
    }

    @GetMapping("/status/filter")
    public ResponseEntity<ApiResponse<List<SystemStatusResponse>>> getComponentStatusesByStatus(
            @RequestParam SystemStatus.ComponentStatus status) {
        List<SystemStatusResponse> statuses = systemStatusService.getComponentStatusesByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(statuses));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Boolean>> isSystemHealthy() {
        boolean isHealthy = systemStatusService.isSystemHealthy();
        return ResponseEntity.ok(ApiResponse.success(isHealthy));
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<SystemMetricsResponse>> getSystemMetrics() {
        SystemMetricsResponse metrics = systemMonitoringService.getSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
    
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<SystemLogResponse>>> getSystemLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        
        try {
            Page<SystemLogResponse> logs = systemMonitoringService.getSystemLogs(level, search, pageable);
            return ResponseEntity.ok(ApiResponse.success("Logs retrieved successfully", logs));
        } catch (Exception e) {
            log.error("Error fetching system logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch system logs", Page.empty()));
        }
    }
    
    @PostMapping("/logs/generate-test")
    public ResponseEntity<ApiResponse<Void>> generateTestLogs() {
        String[] levels = {"INFO", "WARN", "ERROR", "DEBUG"};
        String[] sources = {"System", "Application", "Security", "Database", "API"};
        String[] messages = {
            "User logged in successfully",
            "Failed login attempt",
            "Database connection established",
            "Processing request",
            "Request completed successfully",
            "Invalid request parameters",
            "Resource not found",
            "Access denied",
            "Configuration loaded",
            "Cache cleared"
        };
        
        Random random = new Random();
        
        for (int i = 0; i < 20; i++) {
            String logLevel = levels[random.nextInt(levels.length)];
            String source = sources[random.nextInt(sources.length)];
            String message = messages[random.nextInt(messages.length)] + " - Test log #" + (i + 1);
            
            // Log with different levels
            switch (logLevel) {
                case "ERROR":
                    log.error("[{}] {}", source, message);
                    break;
                case "WARN":
                    log.warn("[{}] {}", source, message);
                    break;
                case "DEBUG":
                    log.debug("[{}] {}", source, message);
                    break;
                default: // INFO
                    log.info("[{}] {}", source, message);
            }
            
            // Small delay to create different timestamps
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success("Generated 20 test logs with various levels", null));
    }
}
