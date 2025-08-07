package com.civiguard.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for creating or updating a report.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReportRequest {
    private String title;
    private String description;
    
    @JsonProperty("incidentType")
    private String type;  // Maps to incidentType in JSON
    
    private String status = "PENDING";  // Default status
    private String priority;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate date;
    
    private String time;
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonDeserialize(using = LocationDeserializer.class)
    private Location location;
    
    // For string-based location
    @JsonIgnore
    private String locationString;
    
    private String witnesses;
    private String evidence;
    private String reportedBy;

    /**
     * Gets the combined date and time as LocalDateTime.
     * @return LocalDateTime combining date and time, or null if date is not set
     */
    public LocalDateTime getDateTime() {
        if (this.date == null) {
            return null;
        }
        LocalTime parsedTime = this.time != null ? 
            LocalTime.parse(this.time) : 
            LocalTime.MIDNIGHT;
        return LocalDateTime.of(this.date, parsedTime);
    }

    /**
     * Called after deserialization to set the date from a string.
     * @param dateStr The date string to parse
     */
    @JsonProperty("date")
    private void unpackDate(String dateStr) {
        if (dateStr != null) {
            this.date = LocalDate.parse(dateStr);
        }
    }

    /**
     * Represents a location with latitude, longitude, and address.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private Double lat;
        private Double lng;
        private String address;
        
        /**
         * Gets the latitude (alias for getLat()).
         * @return the latitude
         */
        @JsonIgnore
        public Double getLatitude() {
            return lat;
        }
        
        /**
         * Gets the longitude (alias for getLng()).
         * @return the longitude
         */
        @JsonIgnore
        public Double getLongitude() {
            return lng;
        }
    }
}
