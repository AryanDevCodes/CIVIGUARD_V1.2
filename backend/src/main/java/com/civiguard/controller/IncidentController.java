package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.incident.AnonymousIncidentRequest;
import com.civiguard.dto.incident.IncidentRequest;
import com.civiguard.dto.incident.UpdateIncidentRequest;
import com.civiguard.dto.incident.UpdateIncidentStatusRequest;
import com.civiguard.dto.incident.IncidentResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Incident;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.User;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/incidents")
@RequiredArgsConstructor
public class IncidentController {
    private static final Logger logger = LoggerFactory.getLogger(IncidentController.class);
    private final IncidentService incidentService;

    @PostMapping
    @Operation(summary = "Create a new incident", description = "Creates a new incident for an authenticated user.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Incident created successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @RequestBody IncidentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        logger.info("Creating incident for user ID: {}", userPrincipal.getId());
        // Convert the list of officer IDs to a set to avoid duplicates
        Set<Long> officerIds = request.getAssignedOfficerIds() != null ? 
            new HashSet<>(request.getAssignedOfficerIds()) : 
            new HashSet<>();
            
        IncidentResponse incident = incidentService.createIncident(request, userPrincipal.getId(), officerIds);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident reported successfully", incident));
    }

    @PostMapping("/anonymous")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Create an anonymous incident", description = "Allows anonymous users to report incidents.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Incident created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> createAnonymousIncident(
            @Valid @RequestBody AnonymousIncidentRequest request,
            @Parameter(description = "Authenticated user principal (hidden for Swagger)", hidden = true)
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        logger.info("Creating anonymous incident");
        User currentUser = null;
        if (userPrincipal != null) {
            currentUser = new User();
            currentUser.setId(userPrincipal.getId());
            currentUser.setName(userPrincipal.getName());
            currentUser.setEmail(userPrincipal.getEmail());
            // Add other necessary user fields
        }
        IncidentResponse incident = incidentService.createAnonymousIncident(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Anonymous incident reported successfully", incident));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    @Operation(summary = "Get incident by ID", description = "Retrieves an incident by its ID.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Incident retrieved successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Incident not found")
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncidentById(@PathVariable Long id) {
        logger.info("Fetching incident with ID: {}", id);
        IncidentResponse incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(ApiResponse.success("Incident retrieved successfully", incident));
    }

    @GetMapping
    @Operation(summary = "Get all incidents", description = "Retrieves a paginated list of incidents with optional filters.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Incidents retrieved successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> getAllIncidents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentPriority priority,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Pageable pageable) {
        logger.info("Fetching all incidents with filters: type={}, status={}, priority={}, district={}, startDate={}, endDate={}",
                type, status, priority, district, startDate, endDate);
        Page<IncidentResponse> incidents = incidentService.getAllIncidents(
                type, status, priority, district, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success("Incidents retrieved successfully", incidents));
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('CITIZEN')")
    @Operation(summary = "Get user incidents", description = "Retrieves incidents reported by the authenticated user.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User incidents retrieved successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> getUserIncidents(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        logger.info("Fetching incidents for user ID: {}", userPrincipal.getId());
        Page<IncidentResponse> incidents = incidentService.getIncidentsByUser(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("User incidents retrieved successfully", incidents));
    }

    @GetMapping("/assigned-to/{officerId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Get incidents assigned to an officer", 
        description = "Retrieves a paginated list of incidents assigned to a specific officer")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Incidents retrieved successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))
        )
    })
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> getIncidentsByAssignedOfficer(
            @Parameter(description = "ID of the officer to get incidents for") @PathVariable Long officerId,
            Pageable pageable) {
        logger.info("Fetching incidents assigned to officer ID: {}", officerId);
        Page<IncidentResponse> incidents = incidentService.getIncidentsByOfficer(officerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Incidents retrieved successfully", incidents));
    }

    @GetMapping("/by-report/{reportId}")
    @Operation(summary = "Get incident by report ID", description = "Retrieves an incident that was created from a specific report")
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncidentByReportId(
            @PathVariable Long reportId) {
        try {
            // Get the incident by report ID
            Incident incident = incidentService.getIncidentByReportId(reportId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found for report ID: " + reportId));
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Incident retrieved successfully", 
                    incidentService.mapToResponse(incident)));
                    
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving incident by report ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve incident: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Update incident status", 
               description = "Updates the status of an incident.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Incident status updated successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Invalid status provided"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", 
            description = "Incident not found"
        )
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> updateIncidentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        logger.info("Updating status for incident ID: {} to status: {}", id, request.getStatus());
        try {
            IncidentResponse incident = incidentService.updateIncidentStatus(
                id, 
                request.getStatus(), 
                request.getNotes(), 
                userPrincipal.getId()
            );
            return ResponseEntity.ok(ApiResponse.success("Incident status updated successfully", incident));
        } catch (ResourceNotFoundException e) {
            logger.error("Incident not found with id: {}", id, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found with id: " + id);
        } catch (Exception e) {
            logger.error("Error updating incident status for id: " + id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating incident status");
        }
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Assign officers to incident", description = "Assigns officers to an incident.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Officers assigned successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Incident not found")
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> assignOfficersToIncident(
            @PathVariable Long id,
            @RequestBody List<Long> officerIds) {
        logger.info("Assigning officers {} to incident ID: {}", officerIds, id);
        IncidentResponse incident = incidentService.assignOfficersToIncident(id, officerIds);
        return ResponseEntity.ok(ApiResponse.success("Officers assigned to incident successfully", incident));
    }    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Delete an incident", description = "Deletes an incident by ID. Only available to OFFICER and ADMIN roles.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Incident deleted successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid ID supplied"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Incident not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Cannot delete incident with current status")
    })
    public ResponseEntity<ApiResponse<Void>> deleteIncident(
            @Parameter(description = "ID of the incident to delete", required = true)
            @PathVariable Long id) {
        logger.info("Deleting incident ID: {}", id);
        try {
            incidentService.deleteIncident(id);
            return ResponseEntity.ok(ApiResponse.success("Incident deleted successfully"));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid incident ID: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid incident ID: " + e.getMessage(), e);
        } catch (IllegalStateException e) {
            logger.error("Cannot delete incident: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete incident: " + e.getMessage(), e);
        } catch (ResourceNotFoundException e) {
            logger.error("Incident not found: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found: " + e.getMessage(), e);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    @Operation(summary = "Update an incident", description = "Updates an existing incident. Only available to OFFICER and ADMIN roles.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Incident updated successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Incident not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Cannot update incident with current status")
    })
    public ResponseEntity<ApiResponse<IncidentResponse>> updateIncident(
            @Parameter(description = "ID of the incident to update", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentRequest request,
            @Parameter(description = "Authenticated user principal (hidden for Swagger)", hidden = true)
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        logger.info("Updating incident ID: {} by user ID: {} with request: {}", id, userPrincipal.getId(), request);
        
        try {
            // Update the incident using the service layer
            IncidentResponse updatedIncident = incidentService.updateIncident(id, request, userPrincipal.getId());
            
            // Log successful update
            logger.info("Incident ID: {} updated successfully", id);
            
            // Return the updated incident with a success message
            return ResponseEntity.ok(ApiResponse.success("Incident updated successfully", updatedIncident));
            
        } catch (ResourceNotFoundException e) {
            // Handle case where incident is not found
            logger.error("Incident not found: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
            
        } catch (IllegalStateException e) {
            // Handle business rule violations (e.g., trying to update a closed incident)
            logger.warn("Cannot update incident: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
            
        } catch (IllegalArgumentException e) {
            // Handle invalid input
            logger.warn("Invalid input: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
            
        } catch (Exception e) {
            // Handle any other unexpected errors
            logger.error("Error updating incident: {}", e.getMessage(), e);
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "An error occurred while updating the incident", 
                e
            );
        }
    }
}
