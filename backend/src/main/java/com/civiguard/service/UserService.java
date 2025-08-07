
package com.civiguard.service;

import com.civiguard.dto.user.UserProfileRequest;
import com.civiguard.dto.user.UserResponse;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.exception.ResourceAlreadyExistsException;
import com.civiguard.model.User;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUserProfile(Long id, UserProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail()) && 
                userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email is already taken");
        }

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        if (request.getVerificationStatus() != null) {
            user.setVerificationStatus(request.getVerificationStatus());
        }

        User updatedUser = userRepository.save(user);
        UserResponse response = mapToUserResponse(updatedUser);
        // Broadcast real-time update to WebSocket subscribers
        messagingTemplate.convertAndSend("/topic/citizen-updates", response);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String name, String email, Boolean active, Pageable pageable) {
        Specification<User> spec = Specification.where(null);
        
        if (name != null && !name.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
        }
        
        if (email != null && !email.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%"));
        }
        
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        
        return userRepository.findAll(spec, pageable).map(this::mapToUserResponse);
    }

    @Transactional
    public UserResponse setUserActiveStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        user.setActive(active);
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setProfileImage(user.getProfileImage());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setAddress(user.getAddress());
        response.setActive(user.isActive());
        response.setVerificationStatus(user.getVerificationStatus());
        response.setLastLogin(user.getLastLogin());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
