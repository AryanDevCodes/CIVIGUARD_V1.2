
package com.civiguard.service;

import com.civiguard.model.Incident;
import com.civiguard.model.Notification;
import com.civiguard.model.Officer;
import com.civiguard.model.User;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final UserRepository userRepository;

    @Transactional
    public void notifyAdminsNewIncident(Incident incident) {
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        String message = "New incident reported: " + incident.getTitle();
        
        for (User admin : admins) {
            createNotification(admin, message, "INCIDENT_REPORTED");
        }
        
        log.info("Notified {} admins about new incident: {}", admins.size(), incident.getId());
    }

    @Transactional
    public void notifyUserIncidentStatusChanged(Incident incident) {
        if (incident.getReportedBy() == null) {
            return;
        }
        
        String message = "Your incident '" + incident.getTitle() + "' status has been updated to: " + incident.getStatus();
        createNotification(incident.getReportedBy(), message, "STATUS_CHANGED");
        
        log.info("Notified user {} about incident status change: {}", incident.getReportedBy().getId(), incident.getId());
    }

    @Transactional
    public void notifyOfficersAssigned(Incident incident, List<Officer> officers) {
        String message = "You have been assigned to incident: " + incident.getTitle();
        
        for (Officer officer : officers) {
            if (officer.getUser() != null) {
                createNotification(officer.getUser(), message, "ASSIGNED_INCIDENT");
            }
        }
        
        log.info("Notified {} officers about assignment to incident: {}", officers.size(), incident.getId());
    }

    @Transactional
    public void createNotification(User user, String message, String type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        
        user.getNotifications().add(notification);
        userRepository.save(user);
    }
}
