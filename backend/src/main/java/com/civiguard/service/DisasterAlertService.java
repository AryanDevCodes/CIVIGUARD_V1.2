
package com.civiguard.service;

import com.civiguard.dto.disaster.DisasterAlertRequest;
import com.civiguard.dto.disaster.DisasterAlertResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.DisasterAlert;
import com.civiguard.model.User;
import com.civiguard.repository.DisasterAlertRepository;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DisasterAlertService {

    private final DisasterAlertRepository disasterAlertRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
    public DisasterAlertResponse createDisasterAlert(DisasterAlertRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        DisasterAlert alert = new DisasterAlert();
        alert.setTitle(request.getTitle());
        alert.setDescription(request.getDescription());
        alert.setType(request.getType());
        alert.setSeverity(request.getSeverity());
        alert.setAffectedAreas(request.getAffectedAreas());
        alert.setEpicenter(request.getEpicenter());
        alert.setImpactRadiusKm(request.getImpactRadiusKm());
        alert.setStartTime(request.getStartTime());
        alert.setEstimatedEndTime(request.getEstimatedEndTime());
        alert.setActive(true);
        alert.setCreatedBy(user);
        alert.setEvacuationCenters(request.getEvacuationCenters());
        alert.setEmergencyContacts(request.getEmergencyContacts());
        
        DisasterAlert savedAlert = disasterAlertRepository.save(alert);
        
        // Send WebSocket notification
        messagingTemplate.convertAndSend("/topic/disaster-alerts", mapToResponse(savedAlert));
        
        // Notify all users in affected areas
        notifyUsersInAffectedAreas(savedAlert);
        
        return mapToResponse(savedAlert);
    }

    @Transactional(readOnly = true)
    public List<DisasterAlertResponse> getAllActiveAlerts() {
        return disasterAlertRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DisasterAlertResponse getAlertById(Long id) {
        DisasterAlert alert = disasterAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disaster alert", "id", id));
        return mapToResponse(alert);
    }

    @Transactional(readOnly = true)
    public List<DisasterAlertResponse> getActiveAlertsByType(DisasterAlert.DisasterType type) {
        return disasterAlertRepository.findByTypeAndIsActiveTrue(type).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisasterAlertResponse> getActiveAlertsBySeverity(DisasterAlert.AlertSeverity severity) {
        return disasterAlertRepository.findBySeverityAndIsActiveTrue(severity).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisasterAlertResponse> getActiveAlertsByArea(String area) {
        return disasterAlertRepository.findByAffectedAreaAndIsActiveTrue(area).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DisasterAlertResponse deactivateAlert(Long id) {
        DisasterAlert alert = disasterAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disaster alert", "id", id));
        
        alert.setActive(false);
        DisasterAlert savedAlert = disasterAlertRepository.save(alert);
        
        // Send WebSocket notification
        messagingTemplate.convertAndSend("/topic/disaster-alerts", mapToResponse(savedAlert));
        
        return mapToResponse(savedAlert);
    }

    private void notifyUsersInAffectedAreas(DisasterAlert alert) {
        // This method would use the NotificationService to send notifications to users
        // For now, we'll log the action
        log.info("Notifying users in affected areas about disaster alert: {}", alert.getId());
        
        // Example implementation:
        String message = alert.getTitle() + ": " + alert.getDescription();
        for (String area : alert.getAffectedAreas()) {
            // Find users in this area and notify them
            // This is simplified - would need more complex logic in real implementation
            log.info("Sending notifications to users in area: {}", area);
        }
    }

    private DisasterAlertResponse mapToResponse(DisasterAlert alert) {
        DisasterAlertResponse response = new DisasterAlertResponse();
        response.setId(alert.getId());
        response.setTitle(alert.getTitle());
        response.setDescription(alert.getDescription());
        response.setType(alert.getType());
        response.setSeverity(alert.getSeverity());
        response.setAffectedAreas(alert.getAffectedAreas());
        response.setEpicenter(alert.getEpicenter());
        response.setImpactRadiusKm(alert.getImpactRadiusKm());
        response.setStartTime(alert.getStartTime());
        response.setEstimatedEndTime(alert.getEstimatedEndTime());
        response.setActive(alert.isActive());
        response.setEvacuationCenters(alert.getEvacuationCenters());
        response.setEmergencyContacts(alert.getEmergencyContacts());
        response.setCreatedAt(alert.getCreatedAt());
        response.setUpdatedAt(alert.getUpdatedAt());
        
        if (alert.getCreatedBy() != null) {
            DisasterAlertResponse.UserSummary userSummary = new DisasterAlertResponse.UserSummary();
            userSummary.setId(alert.getCreatedBy().getId());
            userSummary.setName(alert.getCreatedBy().getName());
            userSummary.setEmail(alert.getCreatedBy().getEmail());
            response.setCreatedBy(userSummary);
        }
        
        return response;
    }
}
