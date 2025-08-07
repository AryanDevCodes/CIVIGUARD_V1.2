package com.civiguard.controller;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.model.ShiftStatus;
import com.civiguard.service.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/shifts")
public class ShiftController {

    private final ShiftService shiftService;

    public ShiftController(ShiftService shiftService) {
        this.shiftService = shiftService;
    }

    @GetMapping
    public ResponseEntity<List<ShiftDTO>> getAllShifts() {
        return new ResponseEntity<>(shiftService.getAllShifts(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftDTO> getShiftById(@PathVariable Long id) {
        return new ResponseEntity<>(shiftService.getShiftById(id), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ShiftDTO> createShift(@RequestBody ShiftDTO shiftDTO) {
        return new ResponseEntity<>(shiftService.createShift(shiftDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftDTO> updateShift(@PathVariable Long id, @RequestBody ShiftDTO shiftDTO) {
        return new ResponseEntity<>(shiftService.updateShift(id, shiftDTO), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<ShiftDTO>> getShiftsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return new ResponseEntity<>(shiftService.getShiftsBetweenDates(start, end), HttpStatus.OK);
    }

    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<ShiftDTO>> getShiftsByOfficer(@PathVariable Long officerId) {
        return new ResponseEntity<>(shiftService.getShiftsByOfficer(officerId), HttpStatus.OK);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ShiftDTO>> getShiftsByStatus(@PathVariable ShiftStatus status) {
        return new ResponseEntity<>(shiftService.getShiftsByStatus(status), HttpStatus.OK);
    }

    @PatchMapping("/{id}/status/{status}")
    public ResponseEntity<ShiftDTO> updateShiftStatus(
            @PathVariable Long id, 
            @PathVariable ShiftStatus status) {
        return new ResponseEntity<>(shiftService.updateShiftStatus(id, status), HttpStatus.OK);
    }
    
    @GetMapping("/upcoming")
    public ResponseEntity<List<ShiftDTO>> getUpcomingShifts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return new ResponseEntity<>(shiftService.getUpcomingShifts(startDate, endDate), HttpStatus.OK);
    }
}
