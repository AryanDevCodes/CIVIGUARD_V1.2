
package com.civiguard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patrol_vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"routes", "assignedOfficer"})
@EqualsAndHashCode(exclude = {"routes", "assignedOfficer"})
public class PatrolVehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType type;


    private String model;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status = VehicleStatus.ACTIVE;

    @Embedded
    private Location location = new Location();
    
    public Location getLocation() {
        if (location == null) {
            location = new Location();
        }
        return location;
    }
    
    public void setLocation(Location location) {
        this.location = location;
    }
    
    @Column(name = "last_location_update")
    private LocalDateTime lastLocationUpdate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private Officer assignedOfficer;

    // Helper methods to manage bidirectional relationship
    public void assignOfficer(Officer officer) {
        if (this.assignedOfficer != null) {
            this.assignedOfficer.getAssignedVehicles().remove(this);
        }
        this.assignedOfficer = officer;
        if (officer != null && !officer.getAssignedVehicles().contains(this)) {
            officer.getAssignedVehicles().add(this);
        }
    }

    public void removeOfficer() {
        if (this.assignedOfficer != null) {
            Officer officer = this.assignedOfficer;
            this.assignedOfficer = null;
            officer.getAssignedVehicles().remove(this);
        }
    }
    // In PatrolVehicle.java
    @OneToMany(mappedBy = "patrolVehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PatrolRoute> routes = new ArrayList<>();
    
    // Add these helper methods for bidirectional relationship management
    public void addRoute(PatrolRoute route) {
        routes.add(route);
        route.setPatrolVehicle(this);
    }
    
    public void removeRoute(PatrolRoute route) {
        routes.remove(route);
        route.setPatrolVehicle(null);
    }

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum VehicleType {
        PATROL_CAR, MOTORCYCLE, VAN, JEEP, AMBULANCE, FIRE_ENGINE, RIOT_CONTROL
    }

    public enum VehicleStatus {
        ACTIVE, MAINTENANCE, ASSIGNED, OUT_OF_SERVICE
    }
    public void setAssignedOfficer(Officer officer) {
        if (this.assignedOfficer != null) {
            this.assignedOfficer.getAssignedVehicles().remove(this);
        }
        
        this.assignedOfficer = officer;
        
        if (officer != null && !officer.getAssignedVehicles().contains(this)) {
            officer.getAssignedVehicles().add(this);
        }
    }
}
