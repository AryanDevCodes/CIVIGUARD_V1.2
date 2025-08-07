package com.civiguard.service;

import com.civiguard.dto.system.SystemLogResponse;
import com.civiguard.dto.system.SystemMetricsResponse;
import com.civiguard.dto.system.SystemStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface SystemMonitoringService {
    /**
     * Get current system metrics (CPU, memory, disk, etc.)
     */
    SystemMetricsResponse getSystemMetrics();
    
    /**
     * Get system logs with filtering and pagination
     */
    Page<SystemLogResponse> getSystemLogs(String level, String search, Pageable pageable);
    
    /**
     * Get current status of all system components
     */
    List<SystemStatusResponse> getSystemStatus();
    
    /**
     * Get system uptime in seconds
     */
    long getSystemUptime();
    
    /**
     * Get JVM memory usage statistics
     */
    SystemMetricsResponse.MemoryStats getJvmMemoryStats();
    
    /**
     * Get system load average for 1, 5, and 15 minutes
     */
    double[] getSystemLoadAverage();
    
    /**
     * Get disk usage statistics
     */
    SystemMetricsResponse.DiskStats getDiskStats();
    
    /**
     * Get CPU usage statistics
     */
    SystemMetricsResponse.CpuStats getCpuStats();
    
    /**
     * Get system information (OS, Java version, etc.)
     */
    SystemMetricsResponse.SystemInfo getSystemInfo();
}
