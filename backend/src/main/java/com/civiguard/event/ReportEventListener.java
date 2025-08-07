package com.civiguard.event;

import com.civiguard.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReportEventListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void handleReportCreatedEvent(ReportCreatedEvent event) {
        try {
            var report = event.getReport();
            log.info("Processing report created event for report #{}", report.getId());
            
            notificationService.createNotification(
                    null, // For admin group
                    "New Report #" + report.getId() + ": " + report.getTitle(),
                    "NEW_REPORT"
            );
            
            log.info("Successfully processed report created event for report #{}", report.getId());
        } catch (Exception e) {
            log.error("Error processing report created event: {}", e.getMessage(), e);
        }
    }
}
