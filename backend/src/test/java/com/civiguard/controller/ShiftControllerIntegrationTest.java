package com.civiguard.controller;

import com.civiguard.dto.ShiftDTO;
import com.civiguard.model.*;
import com.civiguard.model.ShiftStatus;
import com.civiguard.model.ShiftType;
import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import com.civiguard.service.ShiftService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ShiftControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShiftService shiftService;

    @MockBean
    private ShiftRepository shiftRepository;

    @MockBean
    private OfficerRepository officerRepository;

    private ShiftDTO shiftDTO;
    private Officer officer;
    private Shift shift;

    @BeforeEach
    void setUp() {
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

        shiftDTO = new ShiftDTO();
        shiftDTO.setId(1L);
        shiftDTO.setTitle("Night Patrol");
        shiftDTO.setType(ShiftType.PATROL);
        shiftDTO.setStartTime(shift.getStartTime());
        shiftDTO.setEndTime(shift.getEndTime());
        // Reuse the location from the shift object
        shiftDTO.setLocation(shift.getLocation());
        shiftDTO.setDescription("Night patrol in downtown area");
        shiftDTO.setStatus(ShiftStatus.PENDING);
        shiftDTO.setAssignedOfficerIds(Collections.singleton(officer.getId()));
    }

    @Test
    void createShift_ShouldReturnCreatedShift() throws Exception {
        when(shiftService.createShift(any(ShiftDTO.class))).thenReturn(shiftDTO);

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(shiftDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())))
                .andExpect(jsonPath("$.type", is(shiftDTO.getType().name())));
    }

    @Test
    void getShiftById_ShouldReturnShift() throws Exception {
        when(shiftService.getShiftById(1L)).thenReturn(shiftDTO);

        mockMvc.perform(get("/api/shifts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())));
    }

    @Test
    void getAllShifts_ShouldReturnAllShifts() throws Exception {
        List<ShiftDTO> shifts = Collections.singletonList(shiftDTO);
        when(shiftService.getAllShifts()).thenReturn(shifts);

        mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is(shiftDTO.getTitle())));
    }

    @Test
    void updateShift_ShouldUpdateShift() throws Exception {
        when(shiftService.updateShift(eq(1L), any(ShiftDTO.class))).thenReturn(shiftDTO);

        mockMvc.perform(put("/api/shifts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(shiftDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is(shiftDTO.getTitle())));
    }

    @Test
    void deleteShift_ShouldReturnNoContent() throws Exception {
        doNothing().when(shiftService).deleteShift(1L);

        mockMvc.perform(delete("/api/shifts/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateShiftStatus_ShouldUpdateStatus() throws Exception {
        ShiftDTO updatedShift = ShiftDTO.builder()
                .id(shiftDTO.getId())
                .title(shiftDTO.getTitle())
                .type(shiftDTO.getType())
                .startTime(shiftDTO.getStartTime())
                .endTime(shiftDTO.getEndTime())
                .location(shiftDTO.getLocation())
                .description(shiftDTO.getDescription())
                .status(ShiftStatus.APPROVED)
                .assignedOfficerIds(shiftDTO.getAssignedOfficerIds())
                .createdAt(shiftDTO.getCreatedAt())
                .updatedAt(shiftDTO.getUpdatedAt())
                .build();
        
        when(shiftService.updateShiftStatus(1L, ShiftStatus.APPROVED)).thenReturn(updatedShift);

        mockMvc.perform(put("/api/shifts/1/status")
                .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));
    }

    @Test
    void getShiftsByOfficer_ShouldReturnShifts() throws Exception {
        List<ShiftDTO> shifts = Collections.singletonList(shiftDTO);
        when(shiftService.getShiftsByOfficer(1L)).thenReturn(shifts);

        mockMvc.perform(get("/api/shifts/officer/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is(shiftDTO.getTitle())));
    }

    @Test
    void getShiftsByStatus_ShouldReturnShifts() throws Exception {
        List<ShiftDTO> shifts = Collections.singletonList(shiftDTO);
        when(shiftService.getShiftsByStatus(ShiftStatus.PENDING)).thenReturn(shifts);

        mockMvc.perform(get("/api/shifts/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("PENDING")));
    }

    @Test
    void getUpcomingShifts_ShouldReturnUpcomingShifts() throws Exception {
        List<ShiftDTO> shifts = Collections.singletonList(shiftDTO);
        when(shiftService.getUpcomingShifts(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(shifts);

        mockMvc.perform(get("/api/shifts/upcoming")
                .param("startDate", LocalDateTime.now().toString())
                .param("endDate", LocalDateTime.now().plusDays(7).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // Helper method to convert object to JSON string
    private static String asJsonString(final Object obj) {
        try {
            return new ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
