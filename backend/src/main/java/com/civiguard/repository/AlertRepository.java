package com.civiguard.repository;

import com.civiguard.model.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {
    
    @EntityGraph(attributePaths = {"readByUsers"})
    @Query("SELECT DISTINCT a FROM Alert a LEFT JOIN FETCH a.readByUsers WHERE a.isActive = true")
    List<Alert> findActiveAlertsWithReadByUsers();
    
    @EntityGraph(attributePaths = {"readByUsers"})
    @Query("SELECT DISTINCT a FROM Alert a LEFT JOIN FETCH a.readByUsers WHERE a.id = :id")
    Optional<Alert> findByIdWithReadByUsers(@Param("id") Long id);
    
    @EntityGraph(attributePaths = {"readByUsers"})
    @Query("SELECT DISTINCT a FROM Alert a LEFT JOIN FETCH a.readByUsers WHERE a.location.district = :district AND a.isActive = true")
    List<Alert> findActiveByDistrictWithReadByUsers(@Param("district") String district);
    
    @EntityGraph(attributePaths = {"readByUsers"})
    @Query("SELECT a FROM Alert a")
    Page<Alert> findAllWithReadByUsers(Pageable pageable);
    
    @EntityGraph(attributePaths = {"readByUsers"})
    @Query("SELECT a FROM Alert a WHERE a.id IN :ids")
    List<Alert> findAllByIdsWithReadByUsers(@Param("ids") Set<Long> ids);
    
    // Standard JPA methods
    List<Alert> findByIsActiveTrue();
    Page<Alert> findByIsActiveTrue(Pageable pageable);
    
    @Query("SELECT a FROM Alert a WHERE a.severity = :severity AND a.isActive = true")
    Page<Alert> findActiveBySeverity(Alert.AlertSeverity severity, Pageable pageable);
    
    @Query("SELECT a FROM Alert a WHERE a.startTime <= :now AND (a.endTime IS NULL OR a.endTime >= :now)")
    List<Alert> findCurrentAlerts(LocalDateTime now);
    
    @Query("SELECT a FROM Alert a WHERE a.location.district = :district AND a.isActive = true")
    List<Alert> findActiveByDistrict(String district);
}