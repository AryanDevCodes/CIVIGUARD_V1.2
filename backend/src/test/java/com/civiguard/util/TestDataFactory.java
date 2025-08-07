package com.civiguard.util;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.model.*;

import java.time.LocalDateTime;
import java.util.*;

public class TestDataFactory {

    public static Shift createShift(Long id, ShiftType type, ShiftStatus status, LocalDateTime startTime, LocalDateTime endTime, Officer... officers) {
        Shift shift = new Shift();
        shift.setId(id);
        shift.setTitle(type.name() + " Shift");
        shift.setType(type);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        Location location = new Location();
        location.setAddress("Test Address " + id);
        location.setCity("Test City");
        location.setState("Test State");
        location.setPostalCode("12345");
        location.setCountry("Test Country");
        location.setLatitude(18.5204);
        location.setLongitude(73.8567);
        shift.setLocation(location);
        shift.setDescription("Description for shift " + id);
        shift.setStatus(status);
        
        if (officers != null && officers.length > 0) {
            shift.setAssignedOfficers(new HashSet<>(Arrays.asList(officers)));
        }
        
        return shift;
    }
    
    public static ShiftDTO createShiftDTO(Long id, ShiftType type, ShiftStatus status, LocalDateTime startTime, LocalDateTime endTime, Long... officerIds) {
        ShiftDTO dto = new ShiftDTO();
        dto.setId(id);
        dto.setTitle(type.name() + " Shift");
        dto.setType(type);
        dto.setStartTime(startTime);
        dto.setEndTime(endTime);
        Location location = new Location();
        location.setAddress("Test Address " + id);
        location.setCity("Test City");
        location.setState("Test State");
        location.setPostalCode("12345");
        location.setCountry("Test Country");
        location.setLatitude(18.5204);
        location.setLongitude(73.8567);
        dto.setLocation(location);
        dto.setDescription("Description for shift " + id);
        dto.setStatus(status);
        
        if (officerIds != null && officerIds.length > 0) {
            dto.setAssignedOfficerIds(new HashSet<>(Arrays.asList(officerIds)));
        }
        
        return dto;
    }
    
    public static Officer createOfficer(Long id, String name) {
        Officer officer = new Officer();
        officer.setId(id);
        officer.setName(name);
        return officer;
    }
    
    public static List<Shift> createShiftList(int count, ShiftType type, ShiftStatus status, Officer... officers) {
        List<Shift> shifts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 0; i < count; i++) {
            LocalDateTime startTime = now.plusDays(i).withHour(8).withMinute(0);
            LocalDateTime endTime = startTime.plusHours(8);
            shifts.add(createShift((long) (i + 1), type, status, startTime, endTime, officers));
        }
        
        return shifts;
    }
}
