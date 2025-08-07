package com.civiguard.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patrol_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"patrolVehicle", "assignedOfficer"})
@EqualsAndHashCode(exclude = {"patrolVehicle", "assignedOfficer"})
public class PatrolRoute {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "patrol_route_waypoints",
        joinColumns = @JoinColumn(name = "patrol_route_id")
    )
    private List<Waypoint> waypoints = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private Officer assignedOfficer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PatrolStatus status = PatrolStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patrol_vehicle_id")
    private PatrolVehicle patrolVehicle;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Waypoint {
        @Column(nullable = false)
        private Double lat;
        
        @Column(nullable = false)
        private Double lng;
    }

    public enum PatrolStatus {
        ACTIVE, 
        COMPLETED, 
        PENDING,
        CANCELLED
    }

    // Helper methods
    public void addWaypoint(Double lat, Double lng) {
        if (this.waypoints == null) {
            this.waypoints = new ArrayList<>();
        }
        this.waypoints.add(new Waypoint(lat, lng));
    }

    public void assignOfficer(Officer officer) {
        this.assignedOfficer = officer;
        this.status = PatrolStatus.ACTIVE;
    }

    public void completeRoute() {
        this.status = PatrolStatus.COMPLETED;
    }

    public boolean isActive() {
        return this.status == PatrolStatus.ACTIVE;
    }

    public void setPatrolVehicle(PatrolVehicle vehicle) {
        if (sameAsFormer(vehicle)) {
            return;
        }
        
        PatrolVehicle oldVehicle = this.patrolVehicle;
        this.patrolVehicle = vehicle;
        
        if (oldVehicle != null) {
            oldVehicle.getRoutes().remove(this);
        }
        
        if (vehicle != null && !vehicle.getRoutes().contains(this)) {
            vehicle.getRoutes().add(this);
        }
    }

    private boolean sameAsFormer(PatrolVehicle newVehicle) {
        return patrolVehicle == null ? 
               newVehicle == null : patrolVehicle.equals(newVehicle);
    }
}