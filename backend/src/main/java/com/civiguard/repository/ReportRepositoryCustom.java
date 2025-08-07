package com.civiguard.repository;

import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepositoryCustom {
    List<Report> findReportsWithAssociations(
            String search,
            ReportStatus status,
            String type,
            String priority,
            Long createdBy,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            int limit,
            int offset
    );
    
    long countReportsWithAssociations(
            String search,
            ReportStatus status,
            String type,
            String priority,
            Long createdBy,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    );
}
