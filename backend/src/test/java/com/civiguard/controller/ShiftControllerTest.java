package com.civiguard.controller;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.model.*;
import com.civiguard.service.ShiftService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ShiftControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ShiftService shiftService;

    @InjectMocks
    private ShiftController shiftController;

    private ShiftDTO shiftDTO;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(shiftController).build();

        shiftDTO = new ShiftDTO();
        shiftDTO.setId(1L);
        shiftDTO.setTitle("Night Patrol");
        shiftDTO.setType(ShiftType.PATROL);
        shiftDTO.setStartTime(LocalDateTime.now().plusDays(1));
        shiftDTO.setEndTime(LocalDateTime.now().plusDays(1).plusHours(8));
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
        shiftDTO.setAssignedOfficerIds(new HashSet<>(Collections.singletonList(1L)));
    }

    @Test
    void createShift_ShouldReturnCreatedShift() throws Exception {
        when(shiftService.createShift(any(ShiftDTO.class))).thenReturn(shiftDTO);

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shiftDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())))
                .andExpect(jsonPath("$.type", is(shiftDTO.getType().name())));

        verify(shiftService, times(1)).createShift(any(ShiftDTO.class));
    }

    @Test
    void getShiftById_ShouldReturnShift() throws Exception {
        when(shiftService.getShiftById(1L)).thenReturn(shiftDTO);

        mockMvc.perform(get("/api/shifts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())));

        verify(shiftService, times(1)).getShiftById(1L);
    }

    @Test
    void getAllShifts_ShouldReturnAllShifts() throws Exception {
        when(shiftService.getAllShifts()).thenReturn(Collections.singletonList(shiftDTO));

        mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)));

        verify(shiftService, times(1)).getAllShifts();
    }

    @Test
    void updateShift_ShouldUpdateShift() throws Exception {
        when(shiftService.updateShift(eq(1L), any(ShiftDTO.class))).thenReturn(shiftDTO);

        mockMvc.perform(put("/api/shifts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shiftDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())));

        verify(shiftService, times(1)).updateShift(eq(1L), any(ShiftDTO.class));
    }

    @Test
    void deleteShift_ShouldReturnNoContent() throws Exception {
        doNothing().when(shiftService).deleteShift(1L);

        mockMvc.perform(delete("/api/shifts/1"))
                .andExpect(status().isNoContent());

        verify(shiftService, times(1)).deleteShift(1L);
    }

    @Test
    void updateShiftStatus_ShouldUpdateStatus() throws Exception {
        shiftDTO.setStatus(ShiftStatus.APPROVED);
        when(shiftService.updateShiftStatus(1L, ShiftStatus.APPROVED)).thenReturn(shiftDTO);

        mockMvc.perform(put("/api/shifts/1/status")
                .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        verify(shiftService, times(1)).updateShiftStatus(1L, ShiftStatus.APPROVED);
    }

    @Test
    void getShiftsByOfficer_ShouldReturnShifts() throws Exception {
        when(shiftService.getShiftsByOfficer(1L)).thenReturn(Collections.singletonList(shiftDTO));

        mockMvc.perform(get("/api/shifts/officer/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)));

        verify(shiftService, times(1)).getShiftsByOfficer(1L);
    }

    @Test
    void getShiftsByStatus_ShouldReturnShifts() throws Exception {
        when(shiftService.getShiftsByStatus(ShiftStatus.PENDING))
                .thenReturn(Collections.singletonList(shiftDTO));

        mockMvc.perform(get("/api/shifts/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("PENDING")));

        verify(shiftService, times(1)).getShiftsByStatus(ShiftStatus.PENDING);
    }

    @Test
    void getUpcomingShifts_ShouldReturnUpcomingShifts() throws Exception {
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(7);
        
        when(shiftService.getUpcomingShifts(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(shiftDTO));

        mockMvc.perform(get("/api/shifts/upcoming")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(shiftService, times(1))
                .getUpcomingShifts(any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
