
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
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    @Embedded
    private Location location;

    @AttributeOverrides({
        @AttributeOverride(name = "latitude", column = @Column(name = "radius_latitude")),
        @AttributeOverride(name = "longitude", column = @Column(name = "radius_longitude")),
    })
    private Double radius; // in kilometers

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

    @ManyToMany
    @JoinTable(
        name = "alert_read_by_users",
        joinColumns = @JoinColumn(name = "alert_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> readByUsers = new HashSet<>();

    public boolean isReadByUser(User user) {
        return readByUsers.contains(user);
    }

    public void markAsReadByUser(User user) {
        readByUsers.add(user);
    }

    public enum AlertSeverity {
        INFO, WARNING, DANGER, CRITICAL
    }
}
