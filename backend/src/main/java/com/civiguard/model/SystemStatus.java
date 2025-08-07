
package com.civiguard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String componentName;

    @Enumerated(EnumType.STRING)
    private ComponentStatus status;

    private String description;

    private String version;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private boolean critical;
    private String documentationUrl;
    private String category;
    private Instant lastChecked;

    public enum ComponentStatus {
        UP, DOWN, DEGRADED, MAINTENANCE, OPERATIONAL
    }
}
