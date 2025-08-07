package com.civiguard.controller;

import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.dto.system.SystemMetricsResponse;
import com.civiguard.dto.system.SystemStatusResponse;
import com.civiguard.model.Location;
import com.civiguard.service.IncidentService;
import com.civiguard.service.SystemMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.OperatingSystem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.text.DecimalFormat;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final IncidentService incidentService;
    private final SystemMonitoringService systemMonitoringService;

    private final SystemInfo systemInfo = new SystemInfo();
    private final HardwareAbstractionLayer hardware = systemInfo.getHardware();
    private final OperatingSystem os = systemInfo.getOperatingSystem();
    private final CentralProcessor processor = hardware.getProcessor();
    private long[] previousTicks = new long[CentralProcessor.TickType.values().length];
    private static final DecimalFormat DECIMAL_FORMAT = new DecimalFormat("#.##");

    /**
     * Broadcast system status updates to all subscribers.
     * @param status The system status to broadcast
     */
    public void broadcastSystemStatus(SystemStatusResponse status) {
        messagingTemplate.convertAndSend("/topic/system-status", status);
    }

    /**
     * Broadcast system metrics to all subscribers.
     */
    public void broadcastSystemMetrics(SystemMetricsResponse metrics) {
        messagingTemplate.convertAndSend("/topic/metrics", metrics);
    }

    
    /**
     * Scheduled task to push system metrics every 5 seconds.
     */
    @Scheduled(fixedRate = 5000)
    public void pushSystemMetrics() {
        try {
            // Get system metrics from monitoring service
            SystemMetricsResponse metrics = systemMonitoringService.getSystemMetrics();
            
            // Enhance with real-time system metrics
            enhanceWithRealTimeMetrics(metrics);
            
            // Broadcast to all subscribers
            broadcastSystemMetrics(metrics);
            log.debug("Pushed system metrics to WebSocket subscribers");
        } catch (Exception e) {
            log.error("Error pushing system metrics", e);
        }
    }
    
    /**
     * Enhance system metrics with real-time system information
     */
    private void enhanceWithRealTimeMetrics(SystemMetricsResponse metrics) {
        if (metrics == null) {
            metrics = new SystemMetricsResponse();
        }
        
        try {
            // CPU Metrics
            double cpuLoad = processor.getSystemCpuLoadBetweenTicks(previousTicks) * 100;
            previousTicks = processor.getSystemCpuLoadTicks();
            
            // Set CPU metrics
            metrics.setCpuUsage(roundTwoDecimals(cpuLoad));
            // Get process CPU load (0-1) and convert to percentage
            double processCpuLoad = processor.getSystemCpuLoad(1000) * 100;
            metrics.setProcessCpuUsage(roundTwoDecimals(processCpuLoad));
            metrics.setCpuCores(processor.getLogicalProcessorCount());
            // Get system load averages (1, 5, 15 minutes)
            double[] loadAverages = hardware.getProcessor().getSystemLoadAverage(3);
            metrics.setLoadAverage(loadAverages);
            
            // Memory Metrics
            GlobalMemory memory = hardware.getMemory();
            long totalMemory = memory.getTotal();
            long availableMemory = memory.getAvailable();
            long usedMemory = totalMemory - availableMemory;
            double memoryUsagePercent = (usedMemory * 100.0) / totalMemory;
            
            // Set memory metrics in bytes (as expected by the DTO)
            metrics.setMemoryTotal(totalMemory);
            metrics.setMemoryUsed(usedMemory);
            metrics.setMemoryUsage(roundTwoDecimals(memoryUsagePercent));
            
            // Set system info
            metrics.setTimestamp(Instant.now());
            metrics.setOsName(System.getProperty("os.name"));
            metrics.setOsVersion(System.getProperty("os.version"));
            metrics.setJavaVersion(System.getProperty("java.version"));
            metrics.setUptime(os.getSystemUptime());
            
        } catch (Exception e) {
            log.error("Error gathering real-time system metrics", e);
        }
    }
    
    private double roundTwoDecimals(double value) {
        return Double.parseDouble(DECIMAL_FORMAT.format(value));
    }
    
    private double bytesToGB(long bytes) {
        return bytes / (1024.0 * 1024.0 * 1024.0);
    }

    @MessageMapping("/officer/location")
    public void updateOfficerLocation(Location location, SimpMessageHeaderAccessor headerAccessor) {
        String userId = headerAccessor.getUser().getName();
        log.info("Received location update from officer {}: {}, {}", userId, location.getLatitude(), location.getLongitude());
        
        // Broadcast to admin dashboard
        messagingTemplate.convertAndSend("/topic/officer-locations", Map.of(
            "officerId", userId,
            "location", location,
            "timestamp", System.currentTimeMillis()
        ));
    }

    @MessageMapping("/incident/report")
    @SendTo("/topic/incidents")
    public Map<String, Object> newIncidentReport(Map<String, Object> incidentData) {
        log.info("Received new incident report via WebSocket");
        
        // In a real implementation, you would call the IncidentService
        // For now, just log and echo back
        Map<String, Object> response = new HashMap<>(incidentData);
        response.put("received", true);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }
}
