
package com.civiguard.controller;

import com.civiguard.dto.ApiResponse;
import com.civiguard.dto.officer.OfficerRequest;
import com.civiguard.dto.officer.OfficerResponse;
import com.civiguard.model.Officer;
import com.civiguard.service.OfficerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/officers")
@RequiredArgsConstructor
public class OfficerController {

    private final OfficerService officerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OfficerResponse>> createOfficer(@Valid @RequestBody OfficerRequest request) {
        OfficerResponse officer = officerService.createOfficer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Officer created successfully", officer));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OfficerResponse>> getOfficerById(@PathVariable Long id) {
        OfficerResponse officer = officerService.getOfficerById(id);
        return ResponseEntity.ok(ApiResponse.success(officer));
    }

    @GetMapping("/badge/{badgeNumber}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OfficerResponse>> getOfficerByBadgeNumber(@PathVariable String badgeNumber) {
        OfficerResponse officer = officerService.getOfficerByBadgeNumber(badgeNumber);
        return ResponseEntity.ok(ApiResponse.success(officer));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<OfficerResponse>>> getAllOfficers(Pageable pageable) {
        Page<OfficerResponse> officers = officerService.getAllOfficers(pageable);
        return ResponseEntity.ok(ApiResponse.success(officers));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OfficerResponse>>> getOfficersByStatus(
            @PathVariable Officer.OfficerStatus status) {
        List<OfficerResponse> officers = officerService.getOfficersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(officers));
    }

    @GetMapping("/district/{district}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OfficerResponse>>> getOfficersByDistrict(@PathVariable String district) {
        List<OfficerResponse> officers = officerService.getOfficersByDistrict(district);
        return ResponseEntity.ok(ApiResponse.success(officers));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OfficerResponse>> updateOfficer(
            @PathVariable Long id,
            @Valid @RequestBody OfficerRequest request) {
        OfficerResponse officer = officerService.updateOfficer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Officer updated successfully", officer));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OfficerResponse>> updateOfficerStatus(
            @PathVariable Long id,
            @RequestParam Officer.OfficerStatus status) {
        OfficerResponse officer = officerService.updateOfficerStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Officer status updated successfully", officer));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOfficer(@PathVariable Long id) {
        officerService.deleteOfficer(id);
        return ResponseEntity.ok(ApiResponse.success("Officer deleted successfully"));
    }
}
