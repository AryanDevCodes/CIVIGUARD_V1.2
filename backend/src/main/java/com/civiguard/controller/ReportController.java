package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.ReportDTO;
import com.civiguard.dto.ReportStatusUpdateRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;
import com.civiguard.model.User;
import com.civiguard.repository.UserRepository;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.dto.ReportRequest;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reports")
@Tag(name = "Reports", description = "APIs for managing reports")
public class ReportController {
    private final ReportService reportService;
    private final UserRepository userRepository;

    public ReportController(ReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Get all reports", description = "Retrieves a paginated and filtered list of reports")
    public ResponseEntity<ApiResponse<Page<ReportDTO>>> getAllReports(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
                
        Page<Report> reports = reportService.searchReports(
            search, status, type, priority, createdBy, dateFrom, dateTo, pageable);
            
        // Convert to DTOs
        List<ReportDTO> reportDTOs = reports.getContent().stream()
            .map(ReportDTO::fromEntity)
            .collect(Collectors.toList());
            
        Page<ReportDTO> resultPage = new PageImpl<>(
            reportDTOs, 
            reports.getPageable(), 
            reports.getTotalElements()
        );
            
        return ResponseEntity.ok(ApiResponse.success("Reports retrieved successfully", resultPage));
    }
    
    @PostMapping("/{reportId}/convert-to-incident")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Convert report to incident", 
               description = "Converts a report into an incident for further investigation")
    public ResponseEntity<ApiResponse<IncidentResponse>> convertToIncident(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        IncidentResponse incident = reportService.convertToIncident(
            reportId, 
            userPrincipal.getId(),
            request.getNotes() != null ? request.getNotes() : "",
            request.getOfficerIds() != null ? request.getOfficerIds() : new HashSet<>()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report converted to incident successfully", incident));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get report by ID", description = "Retrieves a single report by its ID")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<ReportDTO>> getReportById(
            @Parameter(description = "ID of the report to retrieve") 
            @PathVariable Long id) {
        // Let the service handle the DTO conversion to ensure proper transaction management
        ReportDTO reportDto = reportService.getReportDtoById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
            
        return ResponseEntity.ok(
            ApiResponse.success("Report retrieved successfully", reportDto)
        );
    }
    
    @PostMapping
    @Operation(summary = "Create a new report", description = "Creates a new incident report")
    public ResponseEntity<ApiResponse<ReportDTO>> createReport(
            @Valid @RequestBody ReportRequest reportRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        // Get the authenticated user
        User user = userRepository.findById(userPrincipal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userPrincipal.getId()));
        
        // Create the report using the service
        Report createdReport = reportService.createReport(reportRequest, user);
        
        // Convert to DTO for the response
        ReportDTO reportDto = ReportDTO.fromEntity(createdReport);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report created successfully", reportDto));
    }
}
