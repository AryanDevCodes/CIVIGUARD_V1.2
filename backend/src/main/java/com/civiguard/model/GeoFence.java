
package com.civiguard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "geofences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoFence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private FenceType type;

    private Double radiusKm;

    @Embedded
    private Location center;

    @OneToMany(mappedBy = "geofence", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("order ASC")
    private List<GeoFencePoint> polygonPoints = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private FencePurpose purpose;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum FenceType {
        CIRCLE, POLYGON
    }

    public enum FencePurpose {
        INCIDENT_ZONE, PATROL_AREA, EVACUATION_ZONE, RESTRICTED_AREA, DISASTER_ZONE
    }
}
