package com.civiguard.model;

import com.civiguard.config.JsonDateTimeDeserializer;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
@Entity
@Table(name = "shifts")
@Data
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftType type;

    @Column(name = "start_time", nullable = false)
    @JsonDeserialize(using = JsonDateTimeDeserializer.class)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    @JsonDeserialize(using = JsonDateTimeDeserializer.class)
    private LocalDateTime endTime;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "address", column = @Column(name = "location_address")),
        @AttributeOverride(name = "city", column = @Column(name = "location_city")),
        @AttributeOverride(name = "state", column = @Column(name = "location_state")),
        @AttributeOverride(name = "postalCode", column = @Column(name = "location_postal_code")),
        @AttributeOverride(name = "country", column = @Column(name = "location_country")),
        @AttributeOverride(name = "latitude", column = @Column(name = "location_latitude")),
        @AttributeOverride(name = "longitude", column = @Column(name = "location_longitude")),
        @AttributeOverride(name = "district", column = @Column(name = "location_district"))
    })
    private Location location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftStatus status = ShiftStatus.PENDING;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "shift_officers",
        joinColumns = @JoinColumn(name = "shift_id"),
        inverseJoinColumns = @JoinColumn(name = "officer_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @Fetch(FetchMode.JOIN)
    private Set<Officer> assignedOfficers = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    @JsonDeserialize(using = JsonDateTimeDeserializer.class)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @JsonDeserialize(using = JsonDateTimeDeserializer.class)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
