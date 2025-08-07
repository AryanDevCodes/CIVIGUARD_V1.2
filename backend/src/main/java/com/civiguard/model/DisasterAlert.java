
package com.civiguard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "disaster_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisasterAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private DisasterType type;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    @ElementCollection
    @CollectionTable(name = "disaster_affected_areas", joinColumns = @JoinColumn(name = "disaster_id"))
    @Column(name = "area")
    private Set<String> affectedAreas = new HashSet<>();

    @Embedded
    private Location epicenter;

    private Double impactRadiusKm;

    private LocalDateTime startTime;

    private LocalDateTime estimatedEndTime;

    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ElementCollection
    @CollectionTable(name = "disaster_evacuation_centers", joinColumns = @JoinColumn(name = "disaster_id"))
    private Set<Location> evacuationCenters = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "disaster_emergency_contacts", joinColumns = @JoinColumn(name = "disaster_id"))
    @Column(name = "contact")
    private Set<String> emergencyContacts = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum DisasterType {
        EARTHQUAKE, FLOOD, CYCLONE, FIRE, LANDSLIDE, TSUNAMI, DROUGHT, HEAT_WAVE, COLD_WAVE, OTHER
    }

    public enum AlertSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public void setEvacuationCenters(Set<Location> evacuationCenters) {
    this.evacuationCenters = evacuationCenters;
}



}
