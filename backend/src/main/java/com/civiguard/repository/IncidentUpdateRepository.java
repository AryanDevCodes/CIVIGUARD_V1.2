package com.civiguard.repository;

import com.civiguard.model.IncidentUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentUpdateRepository extends JpaRepository<IncidentUpdate, Long> {
}
