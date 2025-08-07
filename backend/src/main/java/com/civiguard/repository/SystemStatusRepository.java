
package com.civiguard.repository;

import com.civiguard.model.SystemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemStatusRepository extends JpaRepository<SystemStatus, Long> {
    Optional<SystemStatus> findByComponentName(String componentName);
    List<SystemStatus> findByStatus(SystemStatus.ComponentStatus status);
}
