
package com.civiguard.service;

import com.civiguard.dto.officer.OfficerPerformanceResponse;
import com.civiguard.dto.officer.OfficerRequest;
import com.civiguard.dto.officer.OfficerResponse;
import com.civiguard.exception.BadRequestException;
import com.civiguard.exception.ResourceAlreadyExistsException;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Officer;
import com.civiguard.model.User;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfficerService {

    private final OfficerRepository officerRepository;
    private final UserRepository userRepository;

    @Transactional
    public OfficerResponse createOfficer(OfficerRequest request) {
        if (officerRepository.existsByBadgeNumber(request.getBadgeNumber())) {
            throw new ResourceAlreadyExistsException("Badge number is already taken");
        }
        
        Officer officer = new Officer();
        officer.setName(request.getName());
        officer.setBadgeNumber(request.getBadgeNumber());
        officer.setRank(request.getRank());
        officer.setDepartment(request.getDepartment());
        officer.setStatus(request.getStatus());
        officer.setDistrict(request.getDistrict());
        officer.setJoinDate(request.getJoinDate());
        officer.setDateOfBirth(request.getDateOfBirth());
        officer.setAvatar(request.getAvatar());
        officer.setContactNumber(request.getContactNumber());
        officer.setEmail(request.getEmail());
        officer.setAddress(request.getAddress());
        officer.setEmergencyContact(request.getEmergencyContact());
        officer.setDesignation(request.getDesignation());
        officer.setSpecialization(request.getSpecialization());
        officer.setWeaponNumber(request.getWeaponNumber());
        officer.setBloodGroup(request.getBloodGroup());
        officer.setCurrentPosting(request.getCurrentPosting());
        
        if (request.getPreviousPostings() != null) {
            officer.setPreviousPostings(new ArrayList<>(request.getPreviousPostings()));
        }
        
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            
            if (user.getRole() != User.Role.OFFICER) {
                throw new BadRequestException("User must have OFFICER role");
            }
            
            officer.setUser(user);
        }
        
        Officer savedOfficer = officerRepository.save(officer);
        return mapToResponse(savedOfficer);
    }

    @Transactional(readOnly = true)
    public OfficerResponse getOfficerById(Long id) {
        Officer officer = officerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", id));
        return mapToResponse(officer);
    }

    @Transactional(readOnly = true)
    public OfficerResponse getOfficerByBadgeNumber(String badgeNumber) {
        Officer officer = officerRepository.findByBadgeNumber(badgeNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "badge number", badgeNumber));
        return mapToResponse(officer);
    }

    @Transactional(readOnly = true)
    public Page<OfficerResponse> getAllOfficers(Pageable pageable) {
        return officerRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<OfficerResponse> getOfficersByStatus(Officer.OfficerStatus status) {
        return officerRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfficerResponse> getOfficersByDistrict(String district) {
        return officerRepository.findByDistrict(district).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OfficerResponse updateOfficer(Long id, OfficerRequest request) {
        Officer officer = officerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", id));
        
        if (!officer.getBadgeNumber().equals(request.getBadgeNumber()) && 
                officerRepository.existsByBadgeNumber(request.getBadgeNumber())) {
            throw new ResourceAlreadyExistsException("Badge number is already taken");
        }
        
        // Update basic fields
        officer.setName(request.getName());
        officer.setBadgeNumber(request.getBadgeNumber());
        officer.setRank(request.getRank());
        officer.setDepartment(request.getDepartment());
        officer.setStatus(request.getStatus());
        officer.setDistrict(request.getDistrict());
        officer.setJoinDate(request.getJoinDate());
        officer.setDateOfBirth(request.getDateOfBirth());
        officer.setAvatar(request.getAvatar());
        officer.setContactNumber(request.getContactNumber());
        officer.setEmail(request.getEmail());
        
        // Update additional fields
        officer.setAddress(request.getAddress());
        officer.setEmergencyContact(request.getEmergencyContact());
        officer.setDesignation(request.getDesignation());
        officer.setSpecialization(request.getSpecialization());
        officer.setWeaponNumber(request.getWeaponNumber());
        officer.setBloodGroup(request.getBloodGroup());
        officer.setCurrentPosting(request.getCurrentPosting());
        
        // Update previous postings if provided
        if (request.getPreviousPostings() != null) {
            officer.setPreviousPostings(new ArrayList<>(request.getPreviousPostings()));
        }
        
        // Handle user association
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            
            if (user.getRole() != User.Role.OFFICER) {
                throw new BadRequestException("User must have OFFICER role");
            }
            
            officer.setUser(user);
        } else {
            officer.setUser(null);
        }
        
        Officer savedOfficer = officerRepository.save(officer);
        return mapToResponse(savedOfficer);
    }

    @Transactional
    public OfficerResponse updateOfficerStatus(Long id, Officer.OfficerStatus status) {
        Officer officer = officerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", id));
        
        officer.setStatus(status);
        Officer savedOfficer = officerRepository.save(officer);
        return mapToResponse(savedOfficer);
    }

    @Transactional
    public void deleteOfficer(Long id) {
        if (!officerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Officer", "id", id);
        }
        officerRepository.deleteById(id);
    }

    private OfficerResponse mapToResponse(Officer officer) {
        OfficerResponse response = new OfficerResponse();
        response.setId(officer.getId());
        response.setName(officer.getName());
        response.setBadgeNumber(officer.getBadgeNumber());
        response.setRank(officer.getRank());
        response.setDepartment(officer.getDepartment());
        response.setStatus(officer.getStatus());
        response.setDistrict(officer.getDistrict());
        response.setJoinDate(officer.getJoinDate());
        response.setDateOfBirth(officer.getDateOfBirth());
        response.setAvatar(officer.getAvatar());
        response.setContactNumber(officer.getContactNumber());
        response.setEmail(officer.getEmail());
        response.setAddress(officer.getAddress());
        response.setEmergencyContact(officer.getEmergencyContact());
        response.setDesignation(officer.getDesignation());
        response.setSpecialization(officer.getSpecialization());
        response.setWeaponNumber(officer.getWeaponNumber());
        response.setBloodGroup(officer.getBloodGroup());
        response.setCurrentPosting(officer.getCurrentPosting());
        response.setPreviousPostings(officer.getPreviousPostings() != null ? 
            new ArrayList<>(officer.getPreviousPostings()) : new ArrayList<>());
        response.setCreatedAt(officer.getCreatedAt());
        response.setUpdatedAt(officer.getUpdatedAt());
        
        // Set performance data if available
        if (officer.getPerformance() != null) {
            OfficerPerformanceResponse perfResponse = OfficerPerformanceResponse.fromEntity(officer.getPerformance());
            response.setPerformance(perfResponse);
        }
        
        if (officer.getUser() != null) {
            OfficerResponse.UserSummary userSummary = new OfficerResponse.UserSummary();
            userSummary.setId(officer.getUser().getId());
            userSummary.setName(officer.getUser().getName());
            userSummary.setEmail(officer.getUser().getEmail());
            response.setUser(userSummary);
        }
        
        return response;
    }
}
