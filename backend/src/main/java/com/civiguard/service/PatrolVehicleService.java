package com.civiguard.service;

import com.civiguard.dto.patrol.PatrolVehicleDTO;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Location;
import com.civiguard.model.Officer;
import com.civiguard.model.PatrolVehicle;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.PatrolVehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatrolVehicleService {

    private final PatrolVehicleRepository patrolVehicleRepository;
    private final OfficerRepository officerRepository;

    public List<PatrolVehicleDTO> getAllPatrolVehicles() {
        return patrolVehicleRepository.findAll().stream()
                .map(PatrolVehicleDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    public PatrolVehicleDTO getPatrolVehicleById(Long id) {
        return patrolVehicleRepository.findById(id)
                .map(PatrolVehicleDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Patrol vehicle not found with id: " + id));
    }

    @Transactional
    public PatrolVehicleDTO createPatrolVehicle(PatrolVehicleDTO patrolVehicleDTO) {
        PatrolVehicle patrolVehicle = new PatrolVehicle();
        mapDtoToEntity(patrolVehicleDTO, patrolVehicle);
        return PatrolVehicleDTO.fromEntity(patrolVehicleRepository.save(patrolVehicle));
    }

    @Transactional
    public PatrolVehicleDTO updatePatrolVehicle(Long id, PatrolVehicleDTO patrolVehicleDTO) {
        PatrolVehicle patrolVehicle = patrolVehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patrol vehicle not found with id: " + id));
        mapDtoToEntity(patrolVehicleDTO, patrolVehicle);
        return PatrolVehicleDTO.fromEntity(patrolVehicleRepository.save(patrolVehicle));
    }

    @Transactional
    public void deletePatrolVehicle(Long id) {
        if (!patrolVehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patrol vehicle not found with id: " + id);
        }
        patrolVehicleRepository.deleteById(id);
    }

    @Transactional
    public void assignOfficerToVehicle(Long vehicleId, Long officerId) {
        PatrolVehicle vehicle = patrolVehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Patrol vehicle not found with id: " + vehicleId));
        
        if (officerId == null) {
            vehicle.removeOfficer();
        } else {
            Officer officer = officerRepository.findById(officerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + officerId));
            vehicle.assignOfficer(officer);
        }
        patrolVehicleRepository.save(vehicle);
    }

    private void mapDtoToEntity(PatrolVehicleDTO dto, PatrolVehicle entity) {
        entity.setVehicleNumber(dto.getVehicleNumber());
        entity.setModel(dto.getModel());
        
        if (dto.getType() != null) {
            entity.setType(PatrolVehicle.VehicleType.valueOf(dto.getType()));
        }
        
        if (dto.getStatus() != null) {
            entity.setStatus(PatrolVehicle.VehicleStatus.valueOf(dto.getStatus()));
        }
        
        // Initialize location if null
        if (entity.getLocation() == null) {
            entity.setLocation(new Location());
        }
        
        // Set location data
        Location location = entity.getLocation();
        location.setLatitude(dto.getLatitude());
        location.setLongitude(dto.getLongitude());
        location.setAddress(dto.getAddress());
        location.setCity(dto.getCity());
        location.setState(dto.getState());
        location.setCountry(dto.getCountry());
        location.setPostalCode(dto.getPostalCode());
        location.setDistrict(dto.getDistrict());
        
        // Handle officer assignment through the dedicated method
        if (dto.getAssignedOfficerId() != null) {
            Officer officer = officerRepository.findById(dto.getAssignedOfficerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + dto.getAssignedOfficerId()));
            entity.assignOfficer(officer);
        } else {
            entity.removeOfficer();
        }
    }

    public List<PatrolVehicleDTO> getVehiclesByOfficerId(Long officerId) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with id: " + officerId));
        return patrolVehicleRepository.findByAssignedOfficer(officer).stream()
                .map(PatrolVehicleDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }
}
