package com.civiguard.repository;

import com.civiguard.model.Shift;
import com.civiguard.model.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    
    List<Shift> findByStatus(ShiftStatus status);
    
    @Query("SELECT s FROM Shift s WHERE s.startTime >= :startDate AND s.endTime <= :endDate")
    List<Shift> findBetweenDates(@Param("startDate") LocalDateTime startDate, 
                                @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s FROM Shift s JOIN s.assignedOfficers o WHERE o.id = :officerId")
    List<Shift> findByOfficerId(@Param("officerId") Long officerId);
    
    @Query("SELECT s FROM Shift s WHERE s.startTime >= :startDate AND s.endTime <= :endDate AND s.status = :status")
    List<Shift> findBetweenDatesAndStatus(@Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate,
                                         @Param("status") ShiftStatus status);
                                         
    @Query("SELECT DISTINCT s FROM Shift s JOIN s.assignedOfficers o WHERE o.id IN :officerIds")
    List<Shift> findByAssignedOfficersIdIn(@Param("officerIds") Set<Long> officerIds);
}
