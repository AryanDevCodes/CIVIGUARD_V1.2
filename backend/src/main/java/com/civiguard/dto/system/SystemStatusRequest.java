
package com.civiguard.dto.system;

import com.civiguard.model.SystemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SystemStatusRequest {
    @NotBlank(message = "Component name is required")
    private String componentName;
    
    @NotNull(message = "Status is required")
    private SystemStatus.ComponentStatus status;
    
    private String description;
    
    private String version;
}
