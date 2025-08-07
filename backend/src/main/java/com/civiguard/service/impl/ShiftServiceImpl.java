package com.civiguard.service.impl;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.exception.BadRequestException;
import com.civiguard.exception.ConflictException;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.Officer;
import com.civiguard.model.Shift;
import com.civiguard.model.ShiftStatus;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import com.civiguard.service.ShiftService;
import com.civiguard.util.ShiftValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@Transactional
public class ShiftServiceImpl implements ShiftService {

    private static final int MAX_SHIFTS_PER_DAY = 2;
    private static final int MIN_HOURS_BETWEEN_SHIFTS = 8;
    
    private final ShiftRepository shiftRepository;
    private final OfficerRepository officerRepository;
    private final ShiftValidator shiftValidator;

    public ShiftServiceImpl(ShiftRepository shiftRepository,
                          OfficerRepository officerRepository,
                          ShiftValidator shiftValidator) {
        this.shiftRepository = shiftRepository;
        this.officerRepository = officerRepository;
        this.shiftValidator = shiftValidator;
    }

    @Override
    public List<ShiftDTO> getAllShifts() {
        return shiftRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ShiftDTO getShiftById(Long id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found with id: " + id));
        return convertToDTO(shift);
    }

    @Override
    @Transactional
    public ShiftDTO createShift(ShiftDTO shiftDTO) {
        // Validate shift data
        shiftValidator.validateShift(shiftDTO);
        
        // Check for overlapping shifts
        if (shiftDTO.getAssignedOfficerIds() != null) {
            for (Long officerId : shiftDTO.getAssignedOfficerIds()) {
                validateOfficerAvailability(officerId, shiftDTO.getStartTime(), shiftDTO.getEndTime(), null);
            }
        }
        
        Shift shift = convertToEntity(shiftDTO);
        shift.setStatus(ShiftStatus.PENDING);
        shift.setCreatedAt(LocalDateTime.now());
        shift.setUpdatedAt(LocalDateTime.now());
        
        // Handle officer assignments
        if (shiftDTO.getAssignedOfficerIds() != null && !shiftDTO.getAssignedOfficerIds().isEmpty()) {
            Set<Officer> officers = shiftDTO.getAssignedOfficerIds().stream()
                    .map(officerId -> officerRepository.findById(officerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", officerId)))
                    .collect(Collectors.toSet());
            shift.setAssignedOfficers(officers);
        }
        
        Shift savedShift = shiftRepository.save(shift);
        return convertToDTO(savedShift);
    }

    @Override
    @Transactional
    public ShiftDTO updateShift(Long id, ShiftDTO shiftDTO) {
        Shift existingShift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", id));
        
        // Validate shift data
        shiftValidator.validateShift(shiftDTO);
        
        // Check for overlapping shifts for each officer being assigned
        if (shiftDTO.getAssignedOfficerIds() != null) {
            for (Long officerId : shiftDTO.getAssignedOfficerIds()) {
                validateOfficerAvailability(officerId, shiftDTO.getStartTime(), shiftDTO.getEndTime(), id);
            }
        }
        
        // Update fields from DTO
        existingShift.setTitle(shiftDTO.getTitle());
        existingShift.setType(shiftDTO.getType());
        existingShift.setStartTime(shiftDTO.getStartTime());
        existingShift.setEndTime(shiftDTO.getEndTime());
        existingShift.setLocation(shiftDTO.getLocation());
        existingShift.setDescription(shiftDTO.getDescription());
        existingShift.setUpdatedAt(LocalDateTime.now());
        
        // Update officer assignments if provided
        if (shiftDTO.getAssignedOfficerIds() != null) {
            Set<Officer> officers = shiftDTO.getAssignedOfficerIds().stream()
                    .map(officerId -> officerRepository.findById(officerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", officerId)))
                    .collect(Collectors.toSet());
            existingShift.getAssignedOfficers().clear();
            existingShift.getAssignedOfficers().addAll(officers);
        }
        
        Shift updatedShift = shiftRepository.save(existingShift);
        return convertToDTO(updatedShift);
    }

    @Override
    @Transactional
    public void deleteShift(Long id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", id));
                
        // Prevent deletion of in-progress or completed shifts
        if (shift.getStatus() == ShiftStatus.IN_PROGRESS || 
            shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BadRequestException("Cannot delete a shift that is in progress or completed");
        }
        
        shiftRepository.delete(shift);
    }

    @Override
    public List<ShiftDTO> getShiftsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return shiftRepository.findBetweenDates(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftDTO> getShiftsByOfficer(Long officerId) {
        return shiftRepository.findByOfficerId(officerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftDTO> getShiftsByStatus(ShiftStatus status) {
        if (status == null) {
            throw new BadRequestException("Status cannot be null");
        }
        List<Shift> shifts = shiftRepository.findByStatus(status);
        return shifts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ShiftDTO updateShiftStatus(Long id, ShiftStatus newStatus) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", id));
        
        validateStatusTransition(shift.getStatus(), newStatus);
        shift.setStatus(newStatus);
        shift.setUpdatedAt(LocalDateTime.now());
        
        Shift updatedShift = shiftRepository.save(shift);
        return convertToDTO(updatedShift);
    }
    
    @Override
    public List<ShiftDTO> getUpcomingShifts(LocalDateTime startDate, LocalDateTime endDate) {
        // Validate input parameters
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date must be after start date");
        }
        
        // Get shifts between the specified dates
        List<Shift> shifts = shiftRepository.findBetweenDates(startDate, endDate);
        
        // Convert to DTOs and return
        return shifts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Validation methods
    private void validateOfficerAvailability(Long officerId, LocalDateTime startTime, LocalDateTime endTime, Long excludeShiftId) {
        // Check for overlapping shifts
        List<Shift> overlappingShifts = shiftRepository.findByOfficerId(officerId).stream()
                .filter(shift -> !shift.getId().equals(excludeShiftId))
                .filter(shift -> isOverlapping(shift.getStartTime(), shift.getEndTime(), startTime, endTime))
                .collect(Collectors.toList());
        
        if (!overlappingShifts.isEmpty()) {
            throw new ConflictException("Officer is already assigned to an overlapping shift");
        }
        
        // Check maximum shifts per day
        LocalDateTime startOfDay = startTime.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startTime.toLocalDate().plusDays(1).atStartOfDay();
        
        long shiftsOnSameDay = shiftRepository.findByOfficerId(officerId).stream()
                .filter(shift -> !shift.getId().equals(excludeShiftId))
                .filter(shift -> shift.getStartTime().isAfter(startOfDay) && shift.getStartTime().isBefore(endOfDay))
                .count();
                
        if (shiftsOnSameDay >= MAX_SHIFTS_PER_DAY) {
            throw new BadRequestException("Officer cannot be assigned to more than " + MAX_SHIFTS_PER_DAY + " shifts per day");
        }
        
        // Check minimum hours between shifts
        boolean hasCloseShift = shiftRepository.findByOfficerId(officerId).stream()
                .filter(shift -> !shift.getId().equals(excludeShiftId))
                .anyMatch(shift -> {
                    long hoursBetween = java.time.Duration.between(shift.getEndTime(), startTime).toHours();
                    return hoursBetween > 0 && hoursBetween < MIN_HOURS_BETWEEN_SHIFTS;
                });
                
        if (hasCloseShift) {
            throw new BadRequestException("Officer must have at least " + MIN_HOURS_BETWEEN_SHIFTS + " hours between shifts");
        }
    }
    
    private boolean isOverlapping(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
    
    private void validateStatusTransition(ShiftStatus currentStatus, ShiftStatus newStatus) {
        switch (currentStatus) {
            case PENDING:
                if (!List.of(ShiftStatus.APPROVED, ShiftStatus.REJECTED, ShiftStatus.CANCELLED).contains(newStatus)) {
                    throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case APPROVED:
                if (!List.of(ShiftStatus.IN_PROGRESS, ShiftStatus.CANCELLED).contains(newStatus)) {
                    throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case IN_PROGRESS:
                if (newStatus != ShiftStatus.COMPLETED) {
                    throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case COMPLETED:
            case CANCELLED:
            case REJECTED:
                throw new BadRequestException("Cannot change status from " + currentStatus + " to " + newStatus);
        }
    }
    
    // Manual mapping methods
    private ShiftDTO convertToDTO(Shift shift) {
        if (shift == null) {
            return null;
        }
        
        ShiftDTO dto = new ShiftDTO();
        dto.setId(shift.getId());
        dto.setTitle(shift.getTitle());
        dto.setType(shift.getType());
        dto.setStartTime(shift.getStartTime());
        dto.setEndTime(shift.getEndTime());
        dto.setLocation(shift.getLocation());
        dto.setDescription(shift.getDescription());
        dto.setStatus(shift.getStatus());
        
        if (shift.getAssignedOfficers() != null) {
            Set<Long> officerIds = shift.getAssignedOfficers().stream()
                .filter(Objects::nonNull)
                .map(Officer::getId)
                .collect(Collectors.toSet());
            dto.setAssignedOfficerIds(officerIds);
        } else {
            dto.setAssignedOfficerIds(new HashSet<>());
        }
        
        dto.setCreatedAt(shift.getCreatedAt());
        dto.setUpdatedAt(shift.getUpdatedAt());
        
        return dto;
    }

    private Shift convertToEntity(ShiftDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Shift shift = new Shift();
        shift.setId(dto.getId());
        shift.setTitle(dto.getTitle());
        shift.setType(dto.getType());
        shift.setStartTime(dto.getStartTime());
        shift.setEndTime(dto.getEndTime());
        shift.setLocation(dto.getLocation());
        shift.setDescription(dto.getDescription());
        shift.setStatus(dto.getStatus());
        
        if (dto.getAssignedOfficerIds() != null) {
            Set<Officer> officers = dto.getAssignedOfficerIds().stream()
                .map(id -> officerRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Officer", "id", id)))
                .collect(Collectors.toSet());
            shift.setAssignedOfficers(officers);
        } else {
            shift.setAssignedOfficers(new HashSet<>());
        }
        
        shift.setCreatedAt(dto.getCreatedAt());
        shift.setUpdatedAt(dto.getUpdatedAt() != null ? dto.getUpdatedAt() : LocalDateTime.now());
        
        return shift;
    }
}
