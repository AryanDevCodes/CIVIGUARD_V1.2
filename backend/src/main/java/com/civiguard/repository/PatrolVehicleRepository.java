
package com.civiguard.repository;

import com.civiguard.model.Officer;
import com.civiguard.model.PatrolVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatrolVehicleRepository extends JpaRepository<PatrolVehicle, Long> {
    Optional<PatrolVehicle> findByVehicleNumber(String vehicleNumber);
    
    List<PatrolVehicle> findByStatus(PatrolVehicle.VehicleStatus status);
    
    List<PatrolVehicle> findByAssignedOfficer(Officer officer);
    
    List<PatrolVehicle> findByLastLocationUpdateAfter(LocalDateTime time);
}
