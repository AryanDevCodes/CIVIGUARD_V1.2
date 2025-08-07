package com.civiguard.repository;

import com.civiguard.model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OfficerRepository extends JpaRepository<Officer, Long> {
    Optional<Officer> findByBadgeNumber(String badgeNumber);
    boolean existsByBadgeNumber(String badgeNumber);
    List<Officer> findByStatus(Officer.OfficerStatus status);
    List<Officer> findByDistrict(String district);
    
    @Query(value = """
        SELECT o.* FROM officers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.role = 'OFFICER' 
        AND o.id IN (
            SELECT pv.assigned_officer_id FROM patrol_vehicles pv 
            WHERE pv.status = 'ASSIGNED' AND pv.assigned_officer_id IS NOT NULL
        )
    """, nativeQuery = true)
    List<Officer> findAllWithAssignedVehicles();
    
    @Query(value = """
        SELECT o.* FROM officers o 
        JOIN incident_officers io ON o.id = io.officer_id
        WHERE io.incident_id = :incidentId
    """, nativeQuery = true)
    List<Officer> findByAssignedIncidentId(@Param("incidentId") Long incidentId);
    
    @Query(value = """
        SELECT o.* FROM officers o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.status = 'ACTIVE' 
        AND u.role = 'OFFICER'
        AND (:excludeOfficerId IS NULL OR o.id != :excludeOfficerId)
        AND o.id NOT IN (
            SELECT io.officer_id FROM incident_officers io 
            WHERE io.incident_id = :incidentId
        )
        ORDER BY o.name
    """, nativeQuery = true)
    List<Officer> findAvailableOfficersForIncident(
        @Param("incidentId") Long incidentId,
        @Param("excludeOfficerId") Long excludeOfficerId
    );
    
    @Query("SELECT o FROM Officer o WHERE o.rank = :rank AND o.district = :district")
    List<Officer> findByRankAndDistrict(@Param("rank") Officer.Rank rank, @Param("district") String district);
}
