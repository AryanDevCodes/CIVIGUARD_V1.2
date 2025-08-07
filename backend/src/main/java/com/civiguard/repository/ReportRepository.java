package com.civiguard.repository;

import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;
import com.civiguard.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report>, ReportRepositoryCustom {
    
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.createdBy ORDER BY r.createdAt DESC")
    Page<Report> findAllWithCreatedBy(Pageable pageable);
    
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.createdBy WHERE r.status = :status ORDER BY r.createdAt DESC")
    Page<Report> findByStatus(@Param("status") ReportStatus status, Pageable pageable);
    
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.createdBy " +
           "WHERE r.createdBy = :user ORDER BY r.createdAt DESC")
    Page<Report> findByCreatedBy(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT r FROM Report r JOIN r.assignedOfficers o WHERE o.id = :officerId ORDER BY r.createdAt DESC")
    Page<Report> findByAssignedOfficer(@Param("officerId") Long officerId, Pageable pageable);
    
    @Query("SELECT r FROM Report r WHERE r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    Page<Report> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.assignedOfficers WHERE r.id = :id")
    Optional<Report> findByIdWithAssignedOfficers(@Param("id") Long id);
    
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.assignedOfficers o LEFT JOIN FETCH r.createdBy WHERE r.id = :id")
    Optional<Report> findByIdWithAssignedOfficersAndCreator(@Param("id") Long id);
    
    
    @Query("SELECT r FROM Report r WHERE r.status = :status AND r.createdAt >= :startDate AND r.createdAt <= :endDate")
    Page<Report> findByStatusAndDateRange(
        @Param("status") ReportStatus status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    @Query("SELECT r FROM Report r WHERE r.createdBy.id = :userId AND r.status = :status")
    Page<Report> findByCreatedByAndStatus(
        @Param("userId") Long userId,
        @Param("status") ReportStatus status,
        Pageable pageable
    );
    
    @Query("SELECT r FROM Report r JOIN r.assignedOfficers o WHERE o.id = :officerId AND r.status = :status")
    Page<Report> findByAssignedOfficerAndStatus(
        @Param("officerId") Long officerId,
        @Param("status") ReportStatus status,
        Pageable pageable
    );
    
    @Query("SELECT COUNT(r) FROM Report r WHERE r.status = :status")
    long countByStatus(@Param("status") ReportStatus status);
    
    @Query("SELECT r FROM Report r WHERE " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Report> search(@Param("query") String query, Pageable pageable);
}
