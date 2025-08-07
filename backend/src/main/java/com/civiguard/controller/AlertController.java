package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.alert.AlertRequest;
import com.civiguard.dto.alert.AlertResponse;
import com.civiguard.model.User;
import com.civiguard.repository.UserRepository;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.AlertService;
import com.civiguard.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AlertResponse>> createAlert(
            @Valid @RequestBody AlertRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AlertResponse alert = alertService.createAlert(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Alert created successfully", alert));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AlertResponse>> getAlertById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        AlertResponse alert = alertService.getAlertById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<AlertResponse>>> getAllAlerts(
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        Page<AlertResponse> alerts = alertService.getAllAlerts(pageable, currentUser);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/district/{district}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getActiveAlertsByDistrict(
            @PathVariable String district,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        List<AlertResponse> alerts = alertService.getActiveAlertsByDistrict(district, currentUser);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<Page<AlertResponse>>> getPublicAlerts(Pageable pageable) {
        // For public endpoint, we don't require authentication, so pass null for currentUser
        Page<AlertResponse> alerts = alertService.getActiveAlerts(pageable, null);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AlertResponse>> updateAlertStatus(
            @PathVariable Long id,
            @RequestParam boolean isActive,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        AlertResponse alert = alertService.updateAlertStatus(id, isActive, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Alert status updated successfully", alert));
    }

    // Enhanced: Filter by severity, status, area, createdBy, and date range
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<AlertResponse>>> filterAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        Page<AlertResponse> alerts = alertService.filterAlerts(severity, status, area, createdBy, dateFrom, dateTo, pageable, currentUser);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }
    
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('CITIZEN', 'OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AlertResponse>> markAlertAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AlertResponse alert = alertService.markAlertAsRead(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Alert marked as read", alert));
    }
}
