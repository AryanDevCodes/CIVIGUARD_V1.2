
package com.civiguard.service;

import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Location;
import com.civiguard.model.Officer;
import com.civiguard.model.PatrolVehicle;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.PatrolVehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final PatrolVehicleRepository vehicleRepository;
    private final OfficerRepository officerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public PatrolVehicle createVehicle(PatrolVehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @Transactional(readOnly = true)
    public PatrolVehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }

    @Transactional(readOnly = true)
    public List<PatrolVehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @Transactional
    public PatrolVehicle updateVehicleStatus(Long id, PatrolVehicle.VehicleStatus status) {
        PatrolVehicle vehicle = getVehicleById(id);
        vehicle.setStatus(status);
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public PatrolVehicle assignVehicleToOfficer(Long vehicleId, Long officerId) {
        PatrolVehicle vehicle = getVehicleById(vehicleId);
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", officerId));
        
        vehicle.setAssignedOfficer(officer);
        vehicle.setStatus(PatrolVehicle.VehicleStatus.ASSIGNED);
        
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public PatrolVehicle unassignVehicle(Long vehicleId) {
        PatrolVehicle vehicle = getVehicleById(vehicleId);
        vehicle.setAssignedOfficer(null);
        vehicle.setStatus(PatrolVehicle.VehicleStatus.ACTIVE);
        
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public PatrolVehicle updateVehicleLocation(Long id, Location location) {
        PatrolVehicle vehicle = getVehicleById(id);
        vehicle.setLocation(location);
        vehicle.setLastLocationUpdate(LocalDateTime.now());
        
        PatrolVehicle savedVehicle = vehicleRepository.save(vehicle);
        
        // Send WebSocket notification about vehicle location update
        messagingTemplate.convertAndSend("/topic/vehicle-locations", Map.of(
            "vehicleId", savedVehicle.getId(),
            "vehicleNumber", savedVehicle.getVehicleNumber(),
            "location", savedVehicle.getLocation(),
            "timestamp", savedVehicle.getLastLocationUpdate()
        ));
        
        return savedVehicle;
    }

    @Transactional(readOnly = true)
    public List<PatrolVehicle> getActiveVehicles() {
        return vehicleRepository.findByStatus(PatrolVehicle.VehicleStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<PatrolVehicle> getRecentlyUpdatedVehicles(int minutesAgo) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(minutesAgo);
        return vehicleRepository.findByLastLocationUpdateAfter(cutoffTime);
    }

    @Transactional(readOnly = true)
    public List<PatrolVehicle> getVehiclesByOfficer(Long officerId) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", officerId));
        
        return vehicleRepository.findByAssignedOfficer(officer);
    }
}
