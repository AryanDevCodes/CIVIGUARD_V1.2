// package com.civiguard.controller;

// import com.civiguard.dto.ReportRequest;
// import com.civiguard.dto.incident.IncidentResponse;
// import com.civiguard.model.Report;
// import com.civiguard.model.Report.ReportStatus;
// import com.civiguard.model.User;
// import com.civiguard.service.ReportService;
// import com.civiguard.service.UserService;
// import io.swagger.v3.oas.annotations.Operation;
// import io.swagger.v3.oas.annotations.Parameter;
// import io.swagger.v3.oas.annotations.media.Content;
// import io.swagger.v3.oas.annotations.media.Schema;
// import io.swagger.v3.oas.annotations.responses.ApiResponse;
// import io.swagger.v3.oas.annotations.responses.ApiResponses;
// import io.swagger.v3.oas.annotations.tags.Tag;
// import jakarta.validation.Valid;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.web.PageableDefault;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.validation.annotation.Validated;
// import org.springframework.web.bind.annotation.*;

// import java.util.Set;

// @RestController
// @RequestMapping("/api/v2/reports")
// @Tag(name = "Reports V2", description = "Enhanced APIs for managing incident reports")
// @RequiredArgsConstructor
// @Slf4j
// @Validated
// public class ReportControllerV2 {
//     private final ReportService reportService;
//     private final UserService userService;

//     @GetMapping
//     @Operation(summary = "Get all reports", description = "Retrieve a paginated list of reports with optional filtering")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "200", description = "Successfully retrieved reports"),
//         @ApiResponse(responseCode = "403", description = "Forbidden - User not authorized")
//     })
//     public Page<Report> getAllReports(
//             @Parameter(description = "Pagination and sorting parameters")
//             @PageableDefault(size = 10, sort = "createdAt,desc") Pageable pageable,
//             @Parameter(description = "Filter by report status")
//             @RequestParam(required = false) ReportStatus status) {
//         log.debug("Fetching reports with status: {}", status);
//         return status != null 
//             ? reportService.getReportsByStatus(status, pageable)
//             : reportService.getAllReports(pageable);
//     }

//     @GetMapping("/{id}")
//     @Operation(summary = "Get report by ID", description = "Retrieve a specific report by its ID")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "200", description = "Report found"),
//         @ApiResponse(responseCode = "404", description = "Report not found")
//     })
//     public Report getReportById(
//             @Parameter(description = "ID of the report to retrieve", required = true)
//             @PathVariable Long id) {
//         log.debug("Fetching report with ID: {}", id);
//         return reportService.getReportById(id);
//     }

//     @PostMapping
//     @Operation(summary = "Create a new report", description = "Submit a new incident report")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "201", description = "Report created successfully"),
//         @ApiResponse(responseCode = "400", description = "Invalid input"),
//         @ApiResponse(responseCode = "401", description = "Authentication required")
//     })
//     @ResponseStatus(HttpStatus.CREATED)
//     public Report createReport(
//             @Parameter(description = "Report details", required = true)
//             @Valid @RequestBody ReportRequest reportRequest,
//             @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
//         log.debug("Creating new report: {}", reportRequest.getTitle());
//         User currentUser = userService.getUserByEmail(userDetails.getUsername());
//         return reportService.createReport(reportRequest, currentUser);
//     }

//     @PutMapping("/{id}/status")
//     @Operation(summary = "Update report status", description = "Update the status of an existing report")
//     @PreAuthorize("hasRole('ADMIN') or hasRole('OFFICER')")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "200", description = "Status updated successfully"),
//         @ApiResponse(responseCode = "400", description = "Invalid status transition"),
//         @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient permissions"),
//         @ApiResponse(responseCode = "404", description = "Report not found")
//     })
//     public Report updateReportStatus(
//             @Parameter(description = "ID of the report to update", required = true)
//             @PathVariable Long id,
//             @Parameter(description = "New status for the report", required = true)
//             @RequestParam ReportStatus status,
//             @Parameter(description = "Optional notes about the status change")
//             @RequestParam(required = false) String notes,
//             @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
//         log.debug("Updating status of report {} to {}", id, status);
//         User currentUser = userService.getUserById(userDetails.getUsername());
//         return reportService.updateReportStatus(id, status, notes, currentUser.getId());
//     }

//     @PostMapping("/{id}/officers")
//     @Operation(summary = "Assign officers to report", description = "Assign one or more officers to handle a report")
//     @PreAuthorize("hasRole('ADMIN') or hasRole('OFFICER')")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "200", description = "Officers assigned successfully"),
//         @ApiResponse(responseCode = "400", description = "Invalid request"),
//         @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient permissions"),
//         @ApiResponse(responseCode = "404", description = "Report or officer not found")
//     })
//     public Report assignOfficers(
//             @Parameter(description = "ID of the report", required = true)
//             @PathVariable Long id,
//             @Parameter(description = "Set of officer IDs to assign", required = true)
//             @RequestBody Set<Long> officerIds,
//             @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
//         log.debug("Assigning officers {} to report {}", officerIds, id);
//         User currentUser = userService.getUserByEmail(userDetails.getUsername());
//         return reportService.assignOfficers(id, officerIds, currentUser.getId());
//     }

//     @PostMapping("/{id}/convert-to-incident")
//     @Operation(summary = "Convert report to incident", description = "Convert a report into a full incident")
//     @PreAuthorize("hasRole('ADMIN') or hasRole('OFFICER')")
//     @ApiResponses(value = {
//         @ApiResponse(responseCode = "200", description = "Report converted to incident successfully"),
//         @ApiResponse(responseCode = "400", description = "Cannot convert report to incident"),
//         @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient permissions"),
//         @ApiResponse(responseCode = "404", description = "Report not found")
//     })
//     public ResponseEntity<IncidentResponse> convertToIncident(
//             @Parameter(description = "ID of the report to convert", required = true)
//             @PathVariable Long id,
//             @Parameter(description = "Optional notes about the conversion")
//             @RequestParam(required = false) String notes,
//             @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
//         log.debug("Converting report {} to incident", id);
//         User currentUser = userService.getUserByEmail(userDetails.getUsername());
//         IncidentResponse incident = reportService.convertToIncident(id, currentUser.getId(), notes);
//         return ResponseEntity.ok(incident);
//     }
// }
