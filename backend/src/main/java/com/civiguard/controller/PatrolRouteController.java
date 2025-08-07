package com.civiguard.controller;

import com.civiguard.dto.patrol.PatrolRouteDTO;
import com.civiguard.service.PatrolRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patrol-routes")
@RequiredArgsConstructor
public class PatrolRouteController {

    private final PatrolRouteService patrolRouteService;

    @GetMapping
    public ResponseEntity<List<PatrolRouteDTO>> getAllPatrolRoutes() {
        return ResponseEntity.ok(patrolRouteService.getAllPatrolRoutes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatrolRouteDTO> getPatrolRouteById(@PathVariable Long id) {
        return ResponseEntity.ok(patrolRouteService.getPatrolRouteById(id));
    }

    @PostMapping
    public ResponseEntity<PatrolRouteDTO> createPatrolRoute(@RequestBody PatrolRouteDTO patrolRouteDTO) {
        return ResponseEntity.ok(patrolRouteService.createPatrolRoute(patrolRouteDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatrolRouteDTO> updatePatrolRoute(
            @PathVariable Long id,
            @RequestBody PatrolRouteDTO patrolRouteDTO) {
        return ResponseEntity.ok(patrolRouteService.updatePatrolRoute(id, patrolRouteDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatrolRoute(@PathVariable Long id) {
        patrolRouteService.deletePatrolRoute(id);
        return ResponseEntity.noContent().build();
    }
}
