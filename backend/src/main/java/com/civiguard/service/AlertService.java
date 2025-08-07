package com.civiguard.service;

import com.civiguard.dto.alert.AlertRequest;
import com.civiguard.dto.alert.AlertResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Alert;
import com.civiguard.model.User;
import com.civiguard.repository.AlertRepository;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public AlertResponse createAlert(AlertRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Alert alert = new Alert();
        alert.setTitle(request.getTitle());
        alert.setDescription(request.getDescription());
        alert.setSeverity(request.getSeverity());
        alert.setLocation(request.getLocation());
        alert.setRadius(request.getRadius());
        alert.setStartTime(request.getStartTime());
        alert.setEndTime(request.getEndTime());
        alert.setActive(true);
        alert.setCreatedBy(user);

        Alert savedAlert = alertRepository.save(alert);
        log.info("Alert created: {}", savedAlert.getId());
        
        // Notify citizens based on the alert's location
        notifyUsersInArea(savedAlert);

        // Pass the creator as the current user for the response
        return mapToResponse(savedAlert, user);
    }

    @Transactional(readOnly = true)
    public AlertResponse getAlertById(Long id) {
        Alert alert = alertRepository.findByIdWithReadByUsers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        return mapToResponse(alert, null);
    }
    
    @Transactional(readOnly = true)
    public AlertResponse getAlertById(Long id, User currentUser) {
        Alert alert = alertRepository.findByIdWithReadByUsers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        return mapToResponse(alert, currentUser);
    }
    
    @Transactional
    public AlertResponse markAlertAsRead(Long alertId, Long userId) {
        // Use findByIdWithReadByUsers to ensure the readByUsers collection is initialized
        Alert alert = alertRepository.findByIdWithReadByUsers(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
        if (!alert.isReadByUser(user)) {
            alert.markAsReadByUser(user);
            alert = alertRepository.save(alert);
            log.info("Alert {} marked as read by user {}", alertId, userId);
        }
        
        return mapToResponse(alert, user);
    }

    @Transactional(readOnly = true)
    public Page<AlertResponse> getAllAlerts(Pageable pageable) {
        Page<Alert> alerts = alertRepository.findAllWithReadByUsers(pageable);
        return alerts.map(alert -> mapToResponse(alert, null));
    }
    
    @Transactional(readOnly = true)
    public Page<AlertResponse> getAllAlerts(Pageable pageable, User currentUser) {
        Page<Alert> alerts = alertRepository.findAllWithReadByUsers(pageable);
        return alerts.map(alert -> mapToResponse(alert, currentUser));
    }

    @Transactional(readOnly = true)
    public Page<AlertResponse> getActiveAlerts(Pageable pageable) {
        // For non-paginated active alerts with read status, we need to fetch all and convert to page
        List<Alert> activeAlerts = alertRepository.findActiveAlertsWithReadByUsers();
        return new org.springframework.data.domain.PageImpl<>(
            activeAlerts.stream()
                .map(alert -> mapToResponse(alert, null))
                .collect(Collectors.toList()),
            pageable,
            activeAlerts.size()
        );
    }
    
    @Transactional(readOnly = true)
    public Page<AlertResponse> getActiveAlerts(Pageable pageable, User currentUser) {
        // For non-paginated active alerts with read status, we need to fetch all and convert to page
        List<Alert> activeAlerts = alertRepository.findActiveAlertsWithReadByUsers();
        return new org.springframework.data.domain.PageImpl<>(
            activeAlerts.stream()
                .map(alert -> mapToResponse(alert, currentUser))
                .collect(Collectors.toList()),
            pageable,
            activeAlerts.size()
        );
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getActiveAlertsByDistrict(String district, User currentUser) {
        return alertRepository.findActiveByDistrictWithReadByUsers(district).stream()
                .map(alert -> mapToResponse(alert, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertResponse updateAlertStatus(Long id, boolean isActive, User currentUser) {
        // Use findByIdWithReadByUsers to ensure the readByUsers collection is initialized
        Alert alert = alertRepository.findByIdWithReadByUsers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        alert.setActive(isActive);
        
        if (!isActive && alert.getEndTime() == null) {
            alert.setEndTime(LocalDateTime.now());
        }
        
        Alert savedAlert = alertRepository.save(alert);
        log.info("Alert {} status updated to: {}", id, isActive);
        
        return mapToResponse(savedAlert, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<AlertResponse> filterAlerts(String severity, String status, String area, String createdBy, String dateFrom, String dateTo, Pageable pageable, User currentUser) {
        Specification<Alert> spec = Specification.where(null);

        if (severity != null && !severity.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("severity"), com.civiguard.model.Alert.AlertSeverity.valueOf(severity)));
        }
        if (status != null && !status.isEmpty()) {
            if (status.equalsIgnoreCase("active")) {
                spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isActive")));
            } else if (status.equalsIgnoreCase("inactive")) {
                spec = spec.and((root, query, cb) -> cb.isFalse(root.get("isActive")));
            }
        }
        if (area != null && !area.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("location").get("district"), area));
        }
        if (createdBy != null && !createdBy.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("createdBy").get("name")), "%" + createdBy.toLowerCase() + "%"));
        }
        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ISO_DATE_TIME;
        if (dateFrom != null && !dateFrom.isEmpty()) {
            java.time.LocalDateTime from = java.time.LocalDateTime.parse(dateFrom, dtf);
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        }
        if (dateTo != null && !dateTo.isEmpty()) {
            java.time.LocalDateTime to = java.time.LocalDateTime.parse(dateTo, dtf);
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to));
        }
        return alertRepository.findAll(spec, pageable).map(alert -> mapToResponse(alert, currentUser));
    }

    private void notifyUsersInArea(Alert alert) {
        List<User> citizens = userRepository.findByRole(User.Role.CITIZEN);
        
        String message = alert.getSeverity() + " ALERT: " + alert.getTitle();
        for (User citizen : citizens) {
            notificationService.createNotification(citizen, message, "SAFETY_ALERT");
        }
        
        log.info("Notified {} citizens about new alert: {}", citizens.size(), alert.getId());
    }

    private AlertResponse mapToResponse(Alert alert, User currentUser) {
        AlertResponse response = new AlertResponse();
        response.setId(alert.getId());
        response.setTitle(alert.getTitle());
        response.setDescription(alert.getDescription());
        response.setSeverity(alert.getSeverity());
        response.setLocation(alert.getLocation());
        response.setRadius(alert.getRadius());
        response.setStartTime(alert.getStartTime());
        response.setEndTime(alert.getEndTime());
        response.setActive(alert.isActive());
        
        // Set read status if current user is provided
        if (currentUser != null) {
            response.setRead(alert.isReadByUser(currentUser));
        }

        if (alert.getCreatedBy() != null) {
            AlertResponse.UserSummary userSummary = new AlertResponse.UserSummary();
            userSummary.setId(alert.getCreatedBy().getId());
            userSummary.setName(alert.getCreatedBy().getName()); // Use getName() instead of getFullName()
            userSummary.setRole(alert.getCreatedBy().getRole().name());
            response.setCreatedBy(userSummary);
        }

        response.setCreatedAt(alert.getCreatedAt());
        response.setUpdatedAt(alert.getUpdatedAt());
        return response;
    }
}
