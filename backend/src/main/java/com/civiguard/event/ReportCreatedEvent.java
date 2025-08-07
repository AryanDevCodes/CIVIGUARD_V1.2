package com.civiguard.event;

import com.civiguard.model.Report;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ReportCreatedEvent extends ApplicationEvent {
    private final Report report;

    public ReportCreatedEvent(Object source, Report report) {
        super(source);
        this.report = report;
    }
}
