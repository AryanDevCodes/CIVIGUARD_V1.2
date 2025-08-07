package com.civiguard.service;

import com.civiguard.controller.WebSocketController;
import com.civiguard.dto.system.SystemMetricsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricsBroadcastService {

    private final SystemMonitoringService systemMonitoringService;
    private final WebSocketController webSocketController;
    
    // Broadcast metrics every 5 seconds
    @Scheduled(fixedRate = 5000)
    public void broadcastMetrics() {
        try {
            SystemMetricsResponse metrics = systemMonitoringService.getSystemMetrics();
            webSocketController.broadcastSystemMetrics(metrics);
        } catch (Exception e) {
            log.error("Error broadcasting system metrics", e);
        }
    }
}
