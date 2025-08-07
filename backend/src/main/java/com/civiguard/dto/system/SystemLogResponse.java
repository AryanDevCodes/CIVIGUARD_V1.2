package com.civiguard.dto.system;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Represents a system log entry response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogResponse {
    /**
     * Unique identifier for the log entry
     */
    private String id;
    
    /**
     * Timestamp when the log entry was created
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant timestamp;
    
    /**
     * Log level (INFO, WARN, ERROR, DEBUG, TRACE)
     */
    private String level;
    
    /**
     * Name of the logger that created the log entry
     */
    private String loggerName;
    
    /**
     * Name of the thread that created the log entry
     */
    private String threadName;
    
    /**
     * The log message
     */
    private String message;
    
    /**
     * Component or service that generated the log
     */
    private String component;
    
    /**
     * Exception class name if an exception was logged
     */
    private String exceptionClass;
    
    /**
     * Exception message if an exception was logged
     */
    private String exceptionMessage;
    
    /**
     * Stack trace if an exception was logged
     */
    private String stackTrace;
    
    /**
     * Additional context/mapped diagnostic context (MDC)
     */
    private Map<String, String> context;
    
    /**
     * Name of the application that generated the log
     */
    private String applicationName;
    
    /**
     * Hostname where the log was generated
     */
    private String hostname;
    
    /**
     * IP address of the host where the log was generated
     */
    private String ipAddress;
}
