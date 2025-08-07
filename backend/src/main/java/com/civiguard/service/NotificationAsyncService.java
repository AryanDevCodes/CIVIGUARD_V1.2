package com.civiguard.service;

import com.civiguard.model.Report;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationAsyncService {

    private final NotificationService notificationService;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNewReportNotification(Report report) {
        try {
            log.info("Sending notification for report #{}", report.getId());
            notificationService.createNotification(
                    null, // For admin group
                    "New Report #" + report.getId() + ": " + report.getTitle(),
                    "NEW_REPORT"
            );
            log.info("Successfully notified admins about new report #{}", report.getId());
        } catch (Exception e) {
            log.error("Failed to send notification for report #{}: {}", 
                    report.getId(), e.getMessage(), e);
        }
    }
}
