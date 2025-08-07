package com.civiguard.repository;

import com.civiguard.model.PatrolRoute;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatrolRouteRepository extends JpaRepository<PatrolRoute, Long> {
    List<PatrolRoute> findByAssignedOfficerId(Long officerId);
    List<PatrolRoute> findByStatus(PatrolRoute.PatrolStatus status);
    @EntityGraph(attributePaths = {"patrolVehicle", "assignedOfficer"})
    @Query("SELECT DISTINCT r FROM PatrolRoute r " +
           "LEFT JOIN FETCH r.patrolVehicle " +
           "LEFT JOIN FETCH r.assignedOfficer")
    List<PatrolRoute> findAllWithVehicleAndOfficer();
}
