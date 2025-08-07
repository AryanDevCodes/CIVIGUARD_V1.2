package com.civiguard.util;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.exception.BadRequestException;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ShiftValidator {
    private final ShiftRepository shiftRepository;
    private final OfficerRepository officerRepository;
    
    public void validateShift(ShiftDTO shiftDTO) {
        validateDateTimeRange(shiftDTO.getStartTime(), shiftDTO.getEndTime());
        validateShiftDuration(shiftDTO.getStartTime(), shiftDTO.getEndTime());
        // Add more validation rules as needed
    }
    
    private void validateDateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        
        if (startTime.isAfter(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
        
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot create shift in the past");
        }
    }
    
    private void validateShiftDuration(LocalDateTime startTime, LocalDateTime endTime) {
        long hours = java.time.Duration.between(startTime, endTime).toHours();
        if (hours > 24) {
            throw new BadRequestException("Shift duration cannot exceed 24 hours");
        }
    }
}
