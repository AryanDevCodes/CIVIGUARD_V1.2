
package com.civiguard.repository;

import com.civiguard.model.GeoFence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeoFenceRepository extends JpaRepository<GeoFence, Long> {
    List<GeoFence> findByIsActiveTrue();
    
    List<GeoFence> findByTypeAndIsActiveTrue(GeoFence.FenceType type);
    
    List<GeoFence> findByPurposeAndIsActiveTrue(GeoFence.FencePurpose purpose);
}
