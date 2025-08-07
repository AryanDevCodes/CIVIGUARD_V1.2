
package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.disaster.DisasterAlertRequest;
import com.civiguard.dto.disaster.DisasterAlertResponse;
import com.civiguard.model.DisasterAlert;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.DisasterAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disasters")
@RequiredArgsConstructor
public class DisasterAlertController {

    private final DisasterAlertService disasterAlertService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisasterAlertResponse>> createDisasterAlert(
            @Valid @RequestBody DisasterAlertRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DisasterAlertResponse alert = disasterAlertService.createDisasterAlert(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Disaster alert created successfully", alert));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DisasterAlertResponse>>> getAllActiveAlerts() {
        List<DisasterAlertResponse> alerts = disasterAlertService.getAllActiveAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DisasterAlertResponse>> getAlertById(@PathVariable Long id) {
        DisasterAlertResponse alert = disasterAlertService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<DisasterAlertResponse>>> getActiveAlertsByType(
            @PathVariable DisasterAlert.DisasterType type) {
        List<DisasterAlertResponse> alerts = disasterAlertService.getActiveAlertsByType(type);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<ApiResponse<List<DisasterAlertResponse>>> getActiveAlertsBySeverity(
            @PathVariable DisasterAlert.AlertSeverity severity) {
        List<DisasterAlertResponse> alerts = disasterAlertService.getActiveAlertsBySeverity(severity);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/area/{area}")
    public ResponseEntity<ApiResponse<List<DisasterAlertResponse>>> getActiveAlertsByArea(@PathVariable String area) {
        List<DisasterAlertResponse> alerts = disasterAlertService.getActiveAlertsByArea(area);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisasterAlertResponse>> deactivateAlert(@PathVariable Long id) {
        DisasterAlertResponse alert = disasterAlertService.deactivateAlert(id);
        return ResponseEntity.ok(ApiResponse.success("Disaster alert deactivated successfully", alert));
    }
}
