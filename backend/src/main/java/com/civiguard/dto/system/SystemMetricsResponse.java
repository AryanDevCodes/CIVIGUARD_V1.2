package com.civiguard.dto.system;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetricsResponse {
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant timestamp;
    
    // CPU metrics
    private double cpuUsage; // percentage
    private double processCpuUsage; // percentage
    private double[] loadAverage;
    private int cpuCores;
    
    // Memory metrics
    private long memoryTotal; // bytes
    private long memoryUsed; // bytes
    private double memoryUsage; // percentage
    
    // Disk metrics
    private long diskTotal; // bytes
    private long diskUsed; // bytes
    private double diskUsage; // percentage
    
    // System info
    private String osName;
    private String osVersion;
    private String javaVersion;
    private long uptime; // seconds
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemoryStats {
        private long total; // bytes
        private long used; // bytes
        private long free; // bytes
        private long max; // max memory available to JVM
        private long committed; // memory committed to JVM
        private long usedNonHeap; // non-heap memory used by JVM
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CpuStats {
        private double systemLoadAverage; // 1-minute load average
        private double[] loadAverages; // 1, 5, 15 minute load averages
        private int availableProcessors;
        private double systemCpuLoad; // % of total CPU used
        private double processCpuLoad; // % of CPU used by this JVM
        private long[] ticks; // CPU tick counters
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiskStats {
        private long totalSpace; // bytes
        private long usableSpace; // bytes
        private long freeSpace; // bytes
        private double usagePercent; // percentage used
        private String mountPoint; // disk mount point
        private String type; // filesystem type
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemInfo {
        private String osName;
        private String osVersion;
        private String osArch;
        private String javaVersion;
        private String javaVendor;
        private String jvmName;
        private String jvmVersion;
        private String jvmVendor;
        private long uptime; // seconds
        private long processUptime; // milliseconds
        private String hostname;
        private String ipAddress;
    }
}
