package com.civiguard.controller;

import com.civiguard.dto.patrol.PatrolVehicleDTO;
import com.civiguard.service.PatrolVehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patrol-vehicles")
@RequiredArgsConstructor
public class PatrolVehicleController {

    private final PatrolVehicleService patrolVehicleService;

    @GetMapping
    public ResponseEntity<List<PatrolVehicleDTO>> getAllPatrolVehicles() {
        return ResponseEntity.ok(patrolVehicleService.getAllPatrolVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatrolVehicleDTO> getPatrolVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(patrolVehicleService.getPatrolVehicleById(id));
    }

    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<PatrolVehicleDTO>> getVehiclesByOfficerId(@PathVariable Long officerId) {
        return ResponseEntity.ok(patrolVehicleService.getVehiclesByOfficerId(officerId));
    }

    @PostMapping
    public ResponseEntity<PatrolVehicleDTO> createPatrolVehicle(@RequestBody PatrolVehicleDTO patrolVehicleDTO) {
        return ResponseEntity.ok(patrolVehicleService.createPatrolVehicle(patrolVehicleDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatrolVehicleDTO> updatePatrolVehicle(
            @PathVariable Long id,
            @RequestBody PatrolVehicleDTO patrolVehicleDTO) {
        return ResponseEntity.ok(patrolVehicleService.updatePatrolVehicle(id, patrolVehicleDTO));
    }

    @PutMapping("/{vehicleId}/assign-officer/{officerId}")
    public ResponseEntity<Void> assignOfficerToVehicle(
            @PathVariable Long vehicleId,
            @PathVariable(required = false) Long officerId) {
        patrolVehicleService.assignOfficerToVehicle(vehicleId, officerId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatrolVehicle(@PathVariable Long id) {
        patrolVehicleService.deletePatrolVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
