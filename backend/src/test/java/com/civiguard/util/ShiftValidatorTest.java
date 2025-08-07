package com.civiguard.util;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.exception.BadRequestException;
import com.civiguard.exception.ConflictException;
import com.civiguard.model.*;
import com.civiguard.model.ShiftStatus;
import com.civiguard.model.ShiftType;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiftValidatorTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private OfficerRepository officerRepository;

    @InjectMocks
    private ShiftValidator shiftValidator;

    private ShiftDTO shiftDTO;
    private Officer officer;
    private Shift existingShift;

    @BeforeEach
    void setUp() {
        officer = new Officer();
        officer.setId(1L);
        officer.setName("John Doe");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.plusDays(1);
        LocalDateTime endTime = startTime.plusHours(8);

        shiftDTO = new ShiftDTO();
        shiftDTO.setId(1L);
        shiftDTO.setTitle("Night Patrol");
        shiftDTO.setType(ShiftType.PATROL);
        shiftDTO.setStartTime(startTime);
        shiftDTO.setEndTime(endTime);
        Location location = new Location();
        location.setAddress("123 Main St");
        location.setCity("Downtown");
        location.setState("CA");
        location.setPostalCode("12345");
        location.setCountry("USA");
        location.setLatitude(34.0522);
        location.setLongitude(-118.2437);
        shiftDTO.setLocation(location);
        shiftDTO.setDescription("Night patrol in downtown area");
        shiftDTO.setStatus(ShiftStatus.PENDING);
        shiftDTO.setAssignedOfficerIds(Collections.singleton(officer.getId()));

        existingShift = new Shift();
        existingShift.setId(2L);
        existingShift.setStartTime(startTime.plusHours(1));
        existingShift.setEndTime(endTime.plusHours(1));
        existingShift.setAssignedOfficers(new HashSet<>(Collections.singleton(officer)));
    }

    @Test
    void validateShift_ShouldPass_WithValidData() {
        when(shiftRepository.findByAssignedOfficersIdIn(anySet())).thenReturn(Collections.emptyList());
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.singletonList(officer));
        
        assertDoesNotThrow(() -> shiftValidator.validateShift(shiftDTO));
    }

    @Test
    void validateShift_ShouldThrowException_WhenStartTimeIsAfterEndTime() {
        shiftDTO.setStartTime(shiftDTO.getEndTime().plusHours(1));
        
        BadRequestException exception = assertThrows(BadRequestException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("Start time must be before end time"));
    }

    @Test
    void validateShift_ShouldThrowException_WhenShiftIsTooLong() {
        shiftDTO.setEndTime(shiftDTO.getStartTime().plusHours(13)); // 13 hours shift
        
        BadRequestException exception = assertThrows(BadRequestException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("Shift cannot be longer than 12 hours"));
    }

    @Test
    void validateShift_ShouldThrowException_WhenOfficerNotFound() {
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.emptyList());
        
        BadRequestException exception = assertThrows(BadRequestException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("One or more officers not found"));
    }

    @Test
    void validateShift_ShouldThrowException_WhenOfficerHasOverlappingShift() {
        when(shiftRepository.findByAssignedOfficersIdIn(anySet()))
            .thenReturn(Collections.singletonList(existingShift));
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.singletonList(officer));
        
        ConflictException exception = assertThrows(ConflictException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("has an overlapping shift"));
    }

    @Test
    void validateShift_ShouldPass_WhenUpdatingSameShift() {
        when(shiftRepository.findByAssignedOfficersIdIn(anySet()))
            .thenReturn(Collections.singletonList(existingShift));
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.singletonList(officer));
        
        // Set the same ID as the existing shift to simulate an update
        shiftDTO.setId(existingShift.getId());
        
        assertDoesNotThrow(() -> shiftValidator.validateShift(shiftDTO));
    }

    @Test
    void validateShift_ShouldThrowException_WhenOfficerHasTooManyShifts() {
        // Create a list of shifts that would exceed the maximum allowed per day (3)
        List<Shift> shifts = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Shift s = new Shift();
            s.setId((long) (i + 10));
            s.setStartTime(shiftDTO.getStartTime().plusDays(i));
            s.setEndTime(shiftDTO.getEndTime().plusDays(i));
            s.setAssignedOfficers(Collections.singleton(officer));
            shifts.add(s);
        }
        
        when(shiftRepository.findByAssignedOfficersIdIn(anySet())).thenReturn(shifts);
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.singletonList(officer));
        
        // Set the shift to the same day as one of the existing shifts
        shiftDTO.setStartTime(shifts.get(0).getStartTime().plusHours(1));
        shiftDTO.setEndTime(shifts.get(0).getEndTime().plusHours(1));
        
        BadRequestException exception = assertThrows(BadRequestException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("Officer cannot have more than 3 shifts per day"));
    }

    @Test
    void validateShift_ShouldThrowException_WhenShiftTooCloseToPrevious() {
        // Create a shift that ends less than 8 hours before the new shift starts
        LocalDateTime now = LocalDateTime.now();
        Shift previousShift = new Shift();
        previousShift.setId(10L);
        previousShift.setStartTime(now.minusHours(10));
        previousShift.setEndTime(now.minusHours(2)); // Ends 2 hours ago
        previousShift.setAssignedOfficers(Collections.singleton(officer));
        
        // New shift starts now (only 2 hours after previous shift ended)
        shiftDTO.setStartTime(now);
        shiftDTO.setEndTime(now.plusHours(8));
        
        when(shiftRepository.findByAssignedOfficersIdIn(anySet()))
            .thenReturn(Collections.singletonList(previousShift));
        when(officerRepository.findAllById(anySet())).thenReturn(Collections.singletonList(officer));
        
        BadRequestException exception = assertThrows(BadRequestException.class, 
            () -> shiftValidator.validateShift(shiftDTO));
        
        assertTrue(exception.getMessage().contains("must have at least 8 hours of rest between shifts"));
    }
}
