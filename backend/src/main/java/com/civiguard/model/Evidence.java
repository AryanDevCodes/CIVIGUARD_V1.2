package com.civiguard.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Represents evidence associated with an incident.
 * Evidence can be photos, videos, documents, or other file types.
 */
@Entity
@Table(name = "evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evidence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceType type;
    
    @Column(length = 1000)
    private String description;
    
    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private Officer uploadedBy;
    
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Types of evidence that can be attached to an incident.
     */
    public enum EvidenceType {
        PHOTO,              // Photographic evidence
        VIDEO,              // Video recording
        AUDIO,              // Audio recording
        DOCUMENT,           // PDF, Word, etc.
        WITNESS_STATEMENT,  // Written or recorded witness account
        OFFICER_REPORT,     // Official police/incident report
        MEDICAL_REPORT,     // Medical examination report
        SURVEILLANCE_FOOTAGE, // CCTV or other surveillance footage
        OTHER               // Any other type of evidence
    }
    
    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
