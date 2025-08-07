
package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.geofence.GeoFenceRequest;
import com.civiguard.dto.geofence.GeoFenceResponse;
import com.civiguard.model.GeoFence;
import com.civiguard.model.Location;
import com.civiguard.security.UserPrincipal;
import com.civiguard.service.GeoFencingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/geofences")
@RequiredArgsConstructor
public class GeoFenceController {

    private final GeoFencingService geoFencingService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GeoFenceResponse>> createGeoFence(
            @Valid @RequestBody GeoFenceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GeoFenceResponse geoFence = geoFencingService.createGeoFence(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Geofence created successfully", geoFence));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GeoFenceResponse>> getGeoFenceById(@PathVariable Long id) {
        GeoFenceResponse geoFence = geoFencingService.getGeoFenceById(id);
        return ResponseEntity.ok(ApiResponse.success(geoFence));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GeoFenceResponse>>> getAllActiveGeoFences() {
        List<GeoFenceResponse> geoFences = geoFencingService.getAllActiveGeoFences();
        return ResponseEntity.ok(ApiResponse.success(geoFences));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GeoFenceResponse>>> getActiveGeoFencesByType(
            @PathVariable GeoFence.FenceType type) {
        List<GeoFenceResponse> geoFences = geoFencingService.getActiveGeoFencesByType(type);
        return ResponseEntity.ok(ApiResponse.success(geoFences));
    }

    @GetMapping("/purpose/{purpose}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GeoFenceResponse>>> getActiveGeoFencesByPurpose(
            @PathVariable GeoFence.FencePurpose purpose) {
        List<GeoFenceResponse> geoFences = geoFencingService.getActiveGeoFencesByPurpose(purpose);
        return ResponseEntity.ok(ApiResponse.success(geoFences));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GeoFenceResponse>> deactivateGeoFence(@PathVariable Long id) {
        GeoFenceResponse geoFence = geoFencingService.deactivateGeoFence(id);
        return ResponseEntity.ok(ApiResponse.success("Geofence deactivated successfully", geoFence));
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> isPointInAnyActiveFence(@RequestBody Location point) {
        boolean isInFence = geoFencingService.isPointInAnyActiveFence(point);
        return ResponseEntity.ok(ApiResponse.success(isInFence));
    }

    @PostMapping("/containing")
    public ResponseEntity<ApiResponse<List<GeoFenceResponse>>> findActiveGeoFencesContainingPoint(
            @RequestBody Location point) {
        List<GeoFenceResponse> geoFences = geoFencingService.findActiveGeoFencesContainingPoint(point);
        return ResponseEntity.ok(ApiResponse.success(geoFences));
    }
}
