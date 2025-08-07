package com.civiguard.service;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.exception.BadRequestException;
import com.civiguard.exception.ConflictException;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.*;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import com.civiguard.service.impl.ShiftServiceImpl;
import com.civiguard.util.ShiftValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiftServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private OfficerRepository officerRepository;

    @Mock
    private ShiftValidator shiftValidator;

    @InjectMocks
    private ShiftServiceImpl shiftService;

    private Shift shift;
    private ShiftDTO shiftDTO;
    private Officer officer;

    @BeforeEach
    void setUp() {
        shiftService = new ShiftServiceImpl(shiftRepository, officerRepository, shiftValidator);

        officer = new Officer();
        officer.setId(1L);
        officer.setName("John Doe");

        shift = new Shift();
        shift.setId(1L);
        shift.setTitle("Night Patrol");
        shift.setType(ShiftType.PATROL);
        shift.setStartTime(LocalDateTime.now().plusDays(1));
        shift.setEndTime(LocalDateTime.now().plusDays(1).plusHours(8));
        Location location = new Location();
        location.setAddress("123 Main St");
        location.setCity("Downtown");
        location.setState("CA");
        location.setPostalCode("12345");
        location.setCountry("USA");
        location.setLatitude(34.0522);
        location.setLongitude(-118.2437);
        shift.setLocation(location);
        shift.setDescription("Night patrol in downtown area");
        shift.setStatus(ShiftStatus.PENDING);
        shift.setAssignedOfficers(new HashSet<>(Collections.singletonList(officer)));

        // Manually create ShiftDTO
        shiftDTO = new ShiftDTO();
        shiftDTO.setId(shift.getId());
        shiftDTO.setTitle(shift.getTitle());
        shiftDTO.setType(shift.getType());
        shiftDTO.setStartTime(shift.getStartTime());
        shiftDTO.setEndTime(shift.getEndTime());
        shiftDTO.setLocation(shift.getLocation());
        shiftDTO.setDescription(shift.getDescription());
        shiftDTO.setStatus(shift.getStatus());
        shiftDTO.setAssignedOfficerIds(Collections.singleton(officer.getId()));
        shiftDTO.setCreatedAt(shift.getCreatedAt());
        shiftDTO.setUpdatedAt(shift.getUpdatedAt());
    }

    @Test
    void createShift_ShouldReturnCreatedShift() {
        // Arrange
        when(shiftRepository.save(any(Shift.class))).thenReturn(shift);
        when(officerRepository.findById(anyLong())).thenReturn(Optional.of(officer));
        doNothing().when(shiftValidator).validateShift(any(ShiftDTO.class));

        // Act
        ShiftDTO result = shiftService.createShift(shiftDTO);

        // Assert
        assertNotNull(result);
        assertEquals(shift.getTitle(), result.getTitle());
        assertEquals(shift.getType(), result.getType());
        verify(shiftRepository, times(1)).save(any(Shift.class));
    }

    @Test
    void getShiftById_ShouldReturnShift_WhenShiftExists() {
        // Arrange
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));

        // Act
        ShiftDTO result = shiftService.getShiftById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(shift.getId(), result.getId());
        assertEquals(shift.getTitle(), result.getTitle());
    }

    @Test
    void getShiftById_ShouldThrowException_WhenShiftNotFound() {
        // Arrange
        when(shiftRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> shiftService.getShiftById(99L));
    }

    @Test
    void updateShift_ShouldUpdateShift_WhenShiftExists() {
        // Arrange
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));
        when(shiftRepository.save(any(Shift.class))).thenReturn(shift);
        when(officerRepository.findById(anyLong())).thenReturn(Optional.of(officer));
        doNothing().when(shiftValidator).validateShift(any(ShiftDTO.class));

        // Update shift DTO
        shiftDTO.setTitle("Updated Night Patrol");
        shiftDTO.setDescription("Updated description");

        // Act
        ShiftDTO result = shiftService.updateShift(1L, shiftDTO);
        // Assert
        assertNotNull(result);
        assertEquals("Updated Night Patrol", result.getTitle());
        assertEquals("Updated description", result.getDescription());
        verify(shiftRepository, times(1)).save(any(Shift.class));
    }

    @Test
    void deleteShift_ShouldDeleteShift_WhenShiftExists() {
        // Arrange
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));
        doNothing().when(shiftRepository).delete(any(Shift.class));

        // Act
        shiftService.deleteShift(1L);

        // Assert
        verify(shiftRepository, times(1)).delete(shift);
    }

    @Test
    void deleteShift_ShouldThrowException_WhenShiftIsInProgress() {
        // Arrange
        shift.setStatus(ShiftStatus.IN_PROGRESS);
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));

        // Act & Assert
        assertThrows(BadRequestException.class, () -> shiftService.deleteShift(1L));
        verify(shiftRepository, never()).delete(any(Shift.class));
    }

    @Test
    void updateShiftStatus_ShouldUpdateStatus_WhenValidTransition() {
        // Arrange
        shift.setStatus(ShiftStatus.PENDING);
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));
        when(shiftRepository.save(any(Shift.class))).thenReturn(shift);

        // Act
        ShiftDTO result = shiftService.updateShiftStatus(1L, ShiftStatus.APPROVED);

        // Assert
        assertEquals(ShiftStatus.APPROVED, result.getStatus());
        verify(shiftRepository, times(1)).save(shift);
    }

    @Test
    void updateShiftStatus_ShouldThrowException_WhenInvalidTransition() {
        // Arrange
        shift.setStatus(ShiftStatus.COMPLETED);
        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));

        // Act & Assert
        assertThrows(BadRequestException.class, 
            () -> shiftService.updateShiftStatus(1L, ShiftStatus.PENDING));
        verify(shiftRepository, never()).save(any(Shift.class));
    }
}
