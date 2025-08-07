
package com.civiguard.repository;

import com.civiguard.model.DisasterAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisasterAlertRepository extends JpaRepository<DisasterAlert, Long> {
    List<DisasterAlert> findByIsActiveTrue();
    
    List<DisasterAlert> findByTypeAndIsActiveTrue(DisasterAlert.DisasterType type);
    
    List<DisasterAlert> findBySeverityAndIsActiveTrue(DisasterAlert.AlertSeverity severity);
    
    @Query("SELECT d FROM DisasterAlert d JOIN d.affectedAreas a WHERE a = :area AND d.isActive = true")
    List<DisasterAlert> findByAffectedAreaAndIsActiveTrue(String area);
}
