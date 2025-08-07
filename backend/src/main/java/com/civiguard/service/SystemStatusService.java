package com.civiguard.service;

import com.civiguard.dto.system.SystemStatusRequest;
import com.civiguard.dto.system.SystemStatusResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.SystemStatus;
import com.civiguard.repository.SystemStatusRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemStatusService {
    private final SystemStatusRepository systemStatusRepository;
    
    @Transactional
    public SystemStatusResponse updateComponentStatus(SystemStatusRequest request) {
        SystemStatus systemStatus = systemStatusRepository.findByComponentName(request.getComponentName())
                .orElse(new SystemStatus());
        
        systemStatus.setComponentName(request.getComponentName());
        systemStatus.setStatus(request.getStatus());
        systemStatus.setDescription(request.getDescription());
        systemStatus.setVersion(request.getVersion());
        
        SystemStatus savedStatus = systemStatusRepository.save(systemStatus);
        return mapToResponse(savedStatus);
    }
    
    @Transactional(readOnly = true)
    public SystemStatusResponse getComponentStatus(String componentName) {
        SystemStatus systemStatus = systemStatusRepository.findByComponentName(componentName)
                .orElseThrow(() -> new ResourceNotFoundException("System component", "name", componentName));
        
        return mapToResponse(systemStatus);
    }
    
    @Transactional(readOnly = true)
    public List<SystemStatusResponse> getAllComponentStatuses() {
        return systemStatusRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SystemStatusResponse> getComponentStatusesByStatus(SystemStatus.ComponentStatus status) {
        return systemStatusRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public boolean isSystemHealthy() {
        List<SystemStatus> statuses = systemStatusRepository.findAll();
        
        // If no components are registered yet, consider system unhealthy
        if (statuses.isEmpty()) {
            return false;
        }
        
        // Check if any critical components are down
        return statuses.stream()
                .noneMatch(status -> status.getStatus() == SystemStatus.ComponentStatus.DOWN);
    }
    
    private SystemStatusResponse mapToResponse(SystemStatus systemStatus) {
        return SystemStatusResponse.builder()
            .id(systemStatus.getId())
            .componentName(systemStatus.getComponentName())
            .status(systemStatus.getStatus().name())  // Convert enum to string
            .description(systemStatus.getDescription())
            .version(systemStatus.getVersion())
            .createdAt(systemStatus.getCreatedAt())
            .updatedAt(systemStatus.getUpdatedAt())
            .lastChecked(systemStatus.getLastChecked() != null ? systemStatus.getLastChecked() : Instant.now())
            .critical(systemStatus.isCritical())
            .documentationUrl(systemStatus.getDocumentationUrl())
            .category(systemStatus.getCategory())
            .build();
    }
}
