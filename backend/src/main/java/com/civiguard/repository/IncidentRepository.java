package com.civiguard.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import com.civiguard.model.Incident;
import com.civiguard.model.Incident.IncidentPriority;
import com.civiguard.model.Incident.IncidentStatus;
import com.civiguard.model.Officer;
import com.civiguard.model.User;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {
    
    @EntityGraph(attributePaths = {"assignedOfficers", "reportedBy", "updates", "images", "tags"})
    Page<Incident> findByAssignedOfficersId(Long officerId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"assignedOfficers", "reportedBy", "updates", "images", "tags"})
    Optional<Incident> findByIdAndAssignedOfficersId(Long id, Long officerId);
    
    @Query(value = """
        SELECT o.* FROM officers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.role = 'OFFICER' 
        AND (:excludeOfficerId IS NULL OR o.id != :excludeOfficerId)
        AND o.id NOT IN (
            SELECT io.officer_id FROM incident_officers io 
            WHERE io.incident_id = :incidentId
        )
    """, nativeQuery = true)
    List<Officer> findAvailableOfficersForIncident(
        @Param("incidentId") Long incidentId,
        @Param("excludeOfficerId") Long excludeOfficerId
    );
    
    @EntityGraph(attributePaths = {"assignedOfficers", "reportedBy", "updates", "images", "tags"})
    @Query("SELECT DISTINCT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId AND i.status IN :statuses")
    Page<Incident> findByAssignedOfficersIdAndStatusIn(
        @Param("officerId") Long officerId,
        @Param("statuses") List<IncidentStatus> statuses,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "JOIN i.assignedOfficers o " +
           "WHERE o.id = :officerId " +
           "AND i.status = 'ASSIGNED' " +
           "AND i.id NOT IN (SELECT i2.id FROM Incident i2 JOIN i2.assignedOfficers o2 WHERE o2.id = :excludeOfficerId)")
    List<Incident> findAssignedIncidentsExcludingOfficer(
        @Param("officerId") Long officerId,
        @Param("excludeOfficerId") Long excludeOfficerId
    );
    
    @Query("SELECT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId")
    List<Incident> findByAssignedOfficersId(@Param("officerId") Long officerId);
    
    @Query("SELECT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId AND i.status = :status")
    Page<Incident> findByAssignedOfficerAndStatus(
        @Param("officerId") Long officerId, 
        @Param("status") IncidentStatus status,
        Pageable pageable
    );
    
    @Query("SELECT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId AND i.priority = :priority")
    Page<Incident> findByAssignedOfficerAndPriority(
        @Param("officerId") Long officerId,
        @Param("priority") IncidentPriority priority,
        Pageable pageable
    );
    
    @Query("SELECT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId AND " +
           "i.updatedAt >= :startDate AND i.updatedAt <= :endDate")
    List<Incident> findRecentByAssignedOfficer(
        @Param("officerId") Long officerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags")
    @Override
    @NonNull
    Page<Incident> findAll(@NonNull Specification<Incident> spec, @NonNull Pageable pageable);
    
    @EntityGraph(attributePaths = {"reportedBy", "assignedOfficers", "images", "tags"})
    @Query("SELECT DISTINCT i FROM Incident i")
    @NonNull
    default Page<Incident> findAllWithRelations(Specification<Incident> spec, Pageable pageable) {
        return findAll(spec, pageable);
    }
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.reportedBy = :reportedBy")
    Page<Incident> findByReportedBy(@Param("reportedBy") User reportedBy, Pageable pageable);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.reportedBy = :reportedBy")
    @NonNull
    default Page<Incident> findByReportedByWithRelations(@Param("reportedBy") User reportedBy, @NonNull Pageable pageable) {
        return findByReportedBy(reportedBy, pageable);
    }
    
    @EntityGraph(attributePaths = {"reportedBy", "assignedOfficers", "images", "tags"})
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.isAnonymous = :isAnonymous")
    Page<Incident> findByIsAnonymous(@Param("isAnonymous") boolean isAnonymous, Pageable pageable);
    
    @EntityGraph(attributePaths = {"reportedBy", "assignedOfficers", "images", "tags"})
    @Query("SELECT DISTINCT i FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId")
    Page<Incident> findByAssignedOfficerId(@Param("officerId") Long officerId, Pageable pageable);
    
    // Add a count query to help with debugging
    @Query(value = "SELECT COUNT(DISTINCT i.id) FROM Incident i JOIN i.assignedOfficers o WHERE o.id = :officerId")
    long countByAssignedOfficerId(@Param("officerId") Long officerId);
    
    @EntityGraph(attributePaths = {"reportedBy", "assignedOfficers", "images", "tags"})
    default Page<Incident> findByAssignedOfficerIdWithRelations(Long officerId, Pageable pageable) {
        return findByAssignedOfficerId(officerId, pageable);
    }
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.status = :status")
    Page<Incident> findByStatus(@Param("status") Incident.IncidentStatus status, Pageable pageable);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.priority = :priority")
    Page<Incident> findByPriority(@Param("priority") Incident.IncidentPriority priority, Pageable pageable);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.incidentType = :incidentType")
    Page<Incident> findByIncidentType(@Param("incidentType") String incidentType, Pageable pageable);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.location.district = :district")
    Page<Incident> findByDistrict(@Param("district") String district, Pageable pageable);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.images " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.reportDetails.reportDate BETWEEN :startDate AND :endDate")
    Page<Incident> findByReportDateBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate, 
        Pageable pageable
    );
    
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = :status")
    long countByStatus(@Param("status") Incident.IncidentStatus status);
    
    @Query("SELECT DISTINCT i FROM Incident i " +
           "LEFT JOIN FETCH i.reportedBy " +
           "LEFT JOIN FETCH i.assignedOfficers " +
           "LEFT JOIN FETCH i.updates " +
           "LEFT JOIN FETCH i.tags " +
           "WHERE i.id = :id")
    Optional<Incident> findByIdWithRelations(@Param("id") Long id);
    
    @Query("SELECT FUNCTION('TO_CHAR', i.reportDetails.reportDate, 'YYYY-MM') as month, i.status, COUNT(i) FROM Incident i GROUP BY month, i.status ORDER BY month ASC")
    List<Object[]> countIncidentsByMonthAndStatus();

    @Query("SELECT i.incidentType, COUNT(i) FROM Incident i GROUP BY i.incidentType")
    List<Object[]> countByIncidentType();

    /**
     * Find an incident by its associated report ID
     * @param reportId The ID of the report
     * @return An Optional containing the incident if found, or empty otherwise
     */
    Optional<Incident> findByReportId(Long reportId);
    
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Incident i JOIN i.assignedOfficers o WHERE i.id = :incidentId AND o.id = :officerId")
    boolean existsByIdAndAssignedOfficersId(@Param("incidentId") Long incidentId, @Param("officerId") Long officerId);
}
