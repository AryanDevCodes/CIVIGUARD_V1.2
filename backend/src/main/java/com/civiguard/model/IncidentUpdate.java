
package com.civiguard.model;

import com.civiguard.model.Incident.IncidentStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incident_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"incident"})
@EqualsAndHashCode(exclude = {"incident"})
public class IncidentUpdate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String content;
    
    @Enumerated(EnumType.STRING)
    private IncidentStatus status;
    
    @Column(length = 2000)
    private String notes;
    
    @ElementCollection
    @CollectionTable(name = "incident_update_evidence", joinColumns = @JoinColumn(name = "update_id"))
    @Column(name = "evidence_url")
    private List<String> evidenceUrls = new ArrayList<>();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    @JsonBackReference(value="incident-updates")
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    @PreUpdate
    public void setTimestamps() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }
}
