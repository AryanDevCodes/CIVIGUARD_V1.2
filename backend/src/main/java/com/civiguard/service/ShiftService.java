package com.civiguard.service;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.model.ShiftStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface ShiftService {
    List<ShiftDTO> getAllShifts();
    ShiftDTO getShiftById(Long id);
    ShiftDTO createShift(ShiftDTO shiftDTO);
    ShiftDTO updateShift(Long id, ShiftDTO shiftDTO);
    void deleteShift(Long id);
    List<ShiftDTO> getShiftsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    List<ShiftDTO> getShiftsByOfficer(Long officerId);
    List<ShiftDTO> getShiftsByStatus(ShiftStatus status);
    ShiftDTO updateShiftStatus(Long id, ShiftStatus status);
    List<ShiftDTO> getUpcomingShifts(LocalDateTime startDate, LocalDateTime endDate);
}
