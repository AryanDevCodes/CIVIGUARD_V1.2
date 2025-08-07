package com.civiguard.model;

import jakarta.persistence.*;
import jakarta.persistence.FetchType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "officers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Officer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String badgeNumber;

    @Enumerated(EnumType.STRING)
    private Rank rank;

    private String department;

    @Enumerated(EnumType.STRING)
    private OfficerStatus status = OfficerStatus.ACTIVE;

    private String district;

    private LocalDate joinDate;

    private String avatar;

    private String contactNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 100)
    private String designation;
    
    @Column(length = 100)
    private String specialization;
    
    @Column(name = "weapon_number", length = 50)
    private String weaponNumber;
    
    @Column(name = "blood_group", length = 5)
    private String bloodGroup;
    
    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;
    
    @Column(name = "current_posting", length = 100)
    private String currentPosting;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "officer_previous_postings",
        joinColumns = @JoinColumn(name = "officer_id")
    )
    @Column(name = "posting")
    private List<String> previousPostings = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "assignedOfficer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PatrolVehicle> assignedVehicles = new ArrayList<>();

    @Embedded
    private OfficerPerformance performance = new OfficerPerformance();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Rank {
        CONSTABLE, HEAD_CONSTABLE, ASSISTANT_SUB_INSPECTOR, SUB_INSPECTOR, INSPECTOR, 
        DEPUTY_SUPERINTENDENT, SUPERINTENDENT, SENIOR_SUPERINTENDENT, DEPUTY_COMMISSIONER, 
        JOINT_COMMISSIONER, ADDITIONAL_COMMISSIONER, COMMISSIONER, INSPECTOR_GENERAL, 
        ADDITIONAL_DIRECTOR_GENERAL, DIRECTOR_GENERAL
    }

    public enum OfficerStatus {
        ACTIVE,         // Officer is on active duty
        ON_PATROL,      // Officer is currently on patrol
        IN_TRAINING,    // Officer is in training
        ON_LEAVE,       // Officer is on leave
        SUSPENDED       // Officer is suspended
    }
}
