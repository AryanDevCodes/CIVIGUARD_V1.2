
package com.civiguard.dto.officer;

import com.civiguard.model.Officer.OfficerStatus;
import com.civiguard.model.Officer.Rank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class OfficerRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Badge number is required")
    private String badgeNumber;

    private Rank rank;

    private String department;

    private OfficerStatus status = OfficerStatus.ACTIVE;

    private String district;

    private LocalDate joinDate;
    
    private LocalDate dateOfBirth;

    private String avatar;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String contactNumber;

    @Email(message = "Email should be valid")
    private String email;
    
    private String address;
    
    private String emergencyContact;
    
    private String designation;
    
    private String specialization;
    
    private String weaponNumber;
    
    private String bloodGroup;
    
    private String currentPosting;
    
    private List<String> previousPostings = new ArrayList<>();
    
    private Long userId;
}
