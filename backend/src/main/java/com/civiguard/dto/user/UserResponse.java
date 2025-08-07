
package com.civiguard.dto.user;

import com.civiguard.model.Address;
import com.civiguard.model.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private User.Role role;
    private String profileImage;
    private String phoneNumber;
    private Address address;
    private boolean isActive;
    private User.VerificationStatus verificationStatus;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
