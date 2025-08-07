package com.civiguard.service;

import com.civiguard.dto.patrol.PatrolRouteDTO;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Officer;
import com.civiguard.model.PatrolRoute;
import com.civiguard.model.PatrolVehicle;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.PatrolRouteRepository;
import com.civiguard.repository.PatrolVehicleRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatrolRouteService {

    private final PatrolRouteRepository patrolRouteRepository;
    private final OfficerRepository officerRepository;
    private final PatrolVehicleRepository patrolVehicleRepository;
    @Transactional(readOnly = true)
    public List<PatrolRouteDTO> getAllPatrolRoutes() {
        return patrolRouteRepository.findAllWithVehicleAndOfficer().stream()
            .map(PatrolRouteDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public PatrolRouteDTO getPatrolRouteById(Long id) {
        return patrolRouteRepository.findById(id)
                .map(PatrolRouteDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Patrol route not found with id: " + id));
    }

    @Transactional
    public PatrolRouteDTO createPatrolRoute(PatrolRouteDTO patrolRouteDTO) {
        PatrolRoute patrolRoute = new PatrolRoute();
        mapDtoToEntity(patrolRouteDTO, patrolRoute);
        return PatrolRouteDTO.fromEntity(patrolRouteRepository.save(patrolRoute));
    }

    @Transactional
    public PatrolRouteDTO updatePatrolRoute(Long id, PatrolRouteDTO patrolRouteDTO) {
        PatrolRoute patrolRoute = patrolRouteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patrol route not found with id: " + id));
        mapDtoToEntity(patrolRouteDTO, patrolRoute);
        return PatrolRouteDTO.fromEntity(patrolRouteRepository.save(patrolRoute));
    }

    @Transactional
    public void deletePatrolRoute(Long id) {
        if (!patrolRouteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patrol route not found with id: " + id);
        }
        patrolRouteRepository.deleteById(id);
    }

    private void mapDtoToEntity(PatrolRouteDTO dto, PatrolRoute entity) {
        entity.setName(dto.getName());
        
        // Handle assigned officer
        if (dto.getAssignedOfficerId() != null) {
            Officer officer = officerRepository.findById(dto.getAssignedOfficerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + dto.getAssignedOfficerId()));
            entity.setAssignedOfficer(officer);
        } else {
            entity.setAssignedOfficer(null);
        }
        
        // Handle patrol vehicle
        if (dto.getPatrolVehicle() != null && dto.getPatrolVehicle().getId() != null) {
            PatrolVehicle vehicle = patrolVehicleRepository.findById(dto.getPatrolVehicle().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patrol vehicle not found with id: " + dto.getPatrolVehicle().getId()));
            entity.setPatrolVehicle(vehicle);
        } else {
            entity.setPatrolVehicle(null);
        }
        
        if (dto.getStatus() != null) {
            entity.setStatus(PatrolRoute.PatrolStatus.valueOf(dto.getStatus()));
        }
        
        if (dto.getWaypoints() != null) {
            entity.setWaypoints(dto.getWaypoints().stream()
                    .map(wp -> new PatrolRoute.Waypoint(wp.getLat(), wp.getLng()))
                    .collect(java.util.stream.Collectors.toList()));
        }
    }
}
