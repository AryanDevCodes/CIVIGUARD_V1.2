package com.civiguard.repository;

import com.civiguard.model.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {
    
    /**
     * Find all evidence associated with a specific incident
     * 
     * @param incidentId The ID of the incident
     * @return List of evidence for the specified incident
     */
    @Query("SELECT e FROM Evidence e WHERE e.incident.id = :incidentId ORDER BY e.uploadedAt DESC")
    List<Evidence> findByIncidentId(@Param("incidentId") Long incidentId);
    
    /**
     * Find evidence by type for a specific incident
     * 
     * @param incidentId The ID of the incident
     * @param type The type of evidence to filter by
     * @return List of matching evidence
     */
    @Query("SELECT e FROM Evidence e WHERE e.incident.id = :incidentId AND e.type = :type ORDER BY e.uploadedAt DESC")
    List<Evidence> findByIncidentIdAndType(
        @Param("incidentId") Long incidentId, 
        @Param("type") Evidence.EvidenceType type
    );
    
    /**
     * Count the number of evidence items for a specific incident
     * 
     * @param incidentId The ID of the incident
     * @return The count of evidence items
     */
    @Query("SELECT COUNT(e) FROM Evidence e WHERE e.incident.id = :incidentId")
    long countByIncidentId(@Param("incidentId") Long incidentId);
    
    /**
     * Find evidence uploaded by a specific officer for any incident
     * 
     * @param officerId The ID of the officer
     * @return List of evidence uploaded by the officer
     */
    @Query("SELECT e FROM Evidence e WHERE e.uploadedBy.id = :officerId ORDER BY e.uploadedAt DESC")
    List<Evidence> findByUploadedBy(@Param("officerId") Long officerId);
}
