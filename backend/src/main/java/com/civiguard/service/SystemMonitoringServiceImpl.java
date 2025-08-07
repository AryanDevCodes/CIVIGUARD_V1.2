package com.civiguard.service;

import com.civiguard.dto.system.SystemLogResponse;
import com.civiguard.dto.system.SystemMetricsResponse;
import com.civiguard.dto.system.SystemStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.OSFileStore;
import oshi.software.os.OSProcess;
import oshi.software.os.OperatingSystem;
import oshi.util.ExecutingCommand;
import oshi.util.FileUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SystemMonitoringServiceImpl implements SystemMonitoringService {
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hardware;
    private final OperatingSystem os;
    private final DateTimeFormatter logTimestampFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private final Runtime runtime = Runtime.getRuntime();
    private final OperatingSystemMXBean osMxBean = ManagementFactory.getOperatingSystemMXBean();
    private final com.sun.management.OperatingSystemMXBean sunOsMxBean = 
        (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

    public SystemMonitoringServiceImpl() {
        this.systemInfo = new SystemInfo();
        this.hardware = this.systemInfo.getHardware();
        this.os = this.systemInfo.getOperatingSystem();
    }
    
    // Cache for system metrics to reduce overhead
    private SystemMetricsResponse cachedMetrics;
    private long lastMetricsUpdate = 0;
    private static final long METRICS_CACHE_TTL_MS = 1000; // 1 second cache
    
    @Override
    public SystemMetricsResponse getSystemMetrics() {
        long now = System.currentTimeMillis();
        if (cachedMetrics == null || now - lastMetricsUpdate > METRICS_CACHE_TTL_MS) {
            try {
                cachedMetrics = collectSystemMetrics();
                lastMetricsUpdate = now;
            } catch (Exception e) {
                log.error("Error collecting system metrics", e);
                throw new RuntimeException("Failed to collect system metrics", e);
            }
        }
        return cachedMetrics;
    }
    
    private SystemMetricsResponse collectSystemMetrics() {
        SystemMetricsResponse response = new SystemMetricsResponse();
        response.setTimestamp(Instant.now());
        
        try {
            // Collect CPU metrics
            SystemMetricsResponse.CpuStats cpuStats = getCpuStats();
            response.setCpuUsage(cpuStats.getSystemCpuLoad() * 100);
            response.setProcessCpuUsage(cpuStats.getProcessCpuLoad() * 100);
            response.setLoadAverage(cpuStats.getLoadAverages());
            response.setCpuCores(cpuStats.getAvailableProcessors());
            
            // Collect memory metrics
            SystemMetricsResponse.MemoryStats memoryStats = getJvmMemoryStats();
            response.setMemoryTotal(memoryStats.getTotal());
            response.setMemoryUsed(memoryStats.getUsed());
            response.setMemoryUsage((memoryStats.getUsed() * 100.0) / memoryStats.getTotal());
            
            // Collect disk metrics
            SystemMetricsResponse.DiskStats diskStats = getDiskStats();
            response.setDiskTotal(diskStats.getTotalSpace());
            response.setDiskUsed(diskStats.getTotalSpace() - diskStats.getFreeSpace());
            response.setDiskUsage(diskStats.getUsagePercent());
            
            // Collect system info
            SystemMetricsResponse.SystemInfo systemInfo = getSystemInfo();
            response.setOsName(systemInfo.getOsName());
            response.setOsVersion(systemInfo.getOsVersion());
            response.setJavaVersion(systemInfo.getJavaVersion());
            response.setUptime(systemInfo.getUptime());
        } catch (Exception e) {
            log.error("Error collecting system metrics", e);
            throw new RuntimeException("Failed to collect system metrics", e);
        }
        
        return response;
    }
    
    @Override
    public SystemMetricsResponse.MemoryStats getJvmMemoryStats() {
        try {
            long total = runtime.totalMemory();
            long free = runtime.freeMemory();
            long max = runtime.maxMemory();
            
            return SystemMetricsResponse.MemoryStats.builder()
                .total(total)
                .used(total - free)
                .free(free)
                .max(max)
                .committed(total)
                .usedNonHeap(ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage().getUsed())
                .build();
        } catch (Exception e) {
            log.error("Error getting JVM memory stats", e);
            throw new RuntimeException("Failed to get JVM memory stats", e);
        }
    }
    
    @Override
    public SystemMetricsResponse.CpuStats getCpuStats() {
        try {
            CentralProcessor processor = hardware.getProcessor();
            double[] loadAverages = processor.getSystemLoadAverage(3);
            
            return SystemMetricsResponse.CpuStats.builder()
                .systemLoadAverage(loadAverages[0])
                .loadAverages(loadAverages)
                .availableProcessors(processor.getLogicalProcessorCount())
                .systemCpuLoad(processor.getSystemCpuLoad(1000))
                .processCpuLoad(sunOsMxBean.getProcessCpuLoad())
                .ticks(processor.getSystemCpuLoadTicks())
                .build();
        } catch (Exception e) {
            log.error("Error getting CPU stats", e);
            throw new RuntimeException("Failed to get CPU stats", e);
        }
    }
    
    @Override
    public SystemMetricsResponse.DiskStats getDiskStats() {
        try {
            List<OSFileStore> fileStores = os.getFileSystem().getFileStores();
            long totalSpace = 0;
            long freeSpace = 0;
            long usableSpace = 0;

            for (OSFileStore fs : fileStores) {
                if (!fs.getDescription().contains("tmpfs") && !fs.getDescription().contains("overlay")) {
                    totalSpace += fs.getTotalSpace();
                    usableSpace += fs.getUsableSpace();
                    freeSpace += fs.getFreeSpace();
                }
            }

            return SystemMetricsResponse.DiskStats.builder()
                .totalSpace(totalSpace)
                .freeSpace(freeSpace)
                .usableSpace(usableSpace)
                .usagePercent((totalSpace - freeSpace) * 100.0 / totalSpace)
                .build();
        } catch (Exception e) {
            log.error("Error collecting system metrics", e);
            throw new RuntimeException("Failed to collect system metrics", e);
        }
    }

    @Override
    public List<SystemStatusResponse> getSystemStatus() {
        List<SystemStatusResponse> statuses = new ArrayList<>();
        
        // Add database status
        statuses.add(createStatusResponse(
            "Database", 
            "UP", 
            "PostgreSQL Database", 
            "14.5", 
            "DATABASE", 
            true,
            "https://www.postgresql.org/docs/14/index.html"
        ));
        
        // Add more system components as needed
        statuses.add(createStatusResponse(
            "API Server", 
            "UP", 
            "Spring Boot Application", 
            "3.2.1", 
            "SERVICE", 
            true,
            "https://spring.io/projects/spring-boot"
        ));
        
        statuses.add(createStatusResponse(
            "File System", 
            "UP", 
            "Local File System", 
            "ext4", 
            "STORAGE", 
            true,
            "https://en.wikipedia.org/wiki/Ext4"
        ));
        
        return statuses;
    }
    
    private SystemStatusResponse createStatusResponse(String name, String status, String description, 
                                                   String version, String category, boolean critical, 
                                                   String documentationUrl) {
        return SystemStatusResponse.builder()
            .componentName(name)
            .status(status)
            .description(description)
            .version(version)
            .category(category)
            .critical(critical)
            .documentationUrl(documentationUrl)
            .lastChecked(Instant.now())
            .build();
    }
    
    @Override
    public long getSystemUptime() {
        try {
            return ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        } catch (Exception e) {
            log.error("Error getting system uptime", e);
            return -1;
        }
    }
    
    @Override
    public double[] getSystemLoadAverage() {
        try {
            double load = osMxBean.getSystemLoadAverage();
            return load >= 0 ? new double[] { load } : new double[] { -1 };
        } catch (Exception e) {
            log.error("Error getting system load average", e);
            return new double[] { -1 };
        }
    }
    
    @Override
    public SystemMetricsResponse.SystemInfo getSystemInfo() {
        String hostname = "unknown";
        String ipAddress = "unknown";
        
        try {
            hostname = InetAddress.getLocalHost().getHostName();
            ipAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("Could not determine hostname or IP address", e);
        }
        
        return SystemMetricsResponse.SystemInfo.builder()
            .osName(os.getFamily())
            .osVersion(os.getVersionInfo().getVersion())
            .osArch(os.getBitness() + "-bit " + os.getManufacturer())
            .javaVersion(System.getProperty("java.version"))
            .javaVendor(System.getProperty("java.vendor"))
            .jvmName(ManagementFactory.getRuntimeMXBean().getVmName())
            .jvmVersion(System.getProperty("java.vm.version"))
            .jvmVendor(System.getProperty("java.vm.vendor"))
            .uptime(ManagementFactory.getRuntimeMXBean().getUptime() / 1000)
            .processUptime(ManagementFactory.getRuntimeMXBean().getUptime())
            .hostname(hostname)
            .ipAddress(ipAddress)
            .build();
    }
    
    private SystemLogResponse parseLogLine(String line) {
        // Simple log line parser - adjust according to your log format
        // Example format: 2023-01-01 12:00:00.000 [thread] LEVEL com.example.Class - Message
        try {
            String[] parts = line.split("\\s+", 5);
            if (parts.length >= 5) {
                String logLevel = parts[2];
                String component = parts[3];
                String message = parts[4];
                
                return SystemLogResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .timestamp(Instant.now()) // You might want to parse the actual timestamp
                    .level(logLevel)
                    .component(component)
                    .message(message)
                    .build();
            }
        } catch (Exception e) {
            log.warn("Failed to parse log line: {}", line, e);
        }
        return null;
    }
    
    @Override
    public Page<SystemLogResponse> getSystemLogs(String level, String search, Pageable pageable) {
        try {
            List<String> logLines = new ArrayList<>();
            
            // Try to read the application log file
            Path logFile = Paths.get("logs/application.log");
            if (Files.exists(logFile) && Files.isReadable(logFile)) {
                logLines = Files.readAllLines(logFile, StandardCharsets.UTF_8);
            } else {
                log.warn("Application log file not found or not readable, falling back to system logs");
                // Fallback to system logs if application log doesn't exist
                Process process = new ProcessBuilder("journalctl", "-n", "100", "--no-pager").start();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    logLines = reader.lines().collect(Collectors.toList());
                }
            }

            // Parse log lines into log entries and filter out any null entries
            List<SystemLogResponse> allLogs = logLines.stream()
                    .map(this::parseLogLine)
                    .filter(Objects::nonNull)
                    .filter(log -> level == null || log.getLevel().equalsIgnoreCase(level))
                    .filter(log -> search == null || 
                        log.getMessage().toLowerCase().contains(search.toLowerCase()) ||
                        (log.getComponent() != null && log.getComponent().toLowerCase().contains(search.toLowerCase())))
                    .collect(Collectors.toList());

            // Handle pagination
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allLogs.size());
            
            if (start >= allLogs.size()) {
                return new PageImpl<>(Collections.emptyList(), pageable, allLogs.size());
            }
            
            return new PageImpl<>(
                allLogs.subList(start, end),
                pageable,
                allLogs.size()
            );
        } catch (IOException e) {
            log.error("Error reading system logs", e);
            throw new RuntimeException("Failed to read system logs", e);
        }
    }
    
    private SystemLogResponse createLog(String level, String component, String message) {
        return SystemLogResponse.builder()
            .id(UUID.randomUUID().toString())
            .timestamp(Instant.now())
            .level(level)
            .component(component)
            .message(message)
            .build();
    }
}
