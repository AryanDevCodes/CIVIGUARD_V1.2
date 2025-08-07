package com.civiguard.dto.incident;

import com.civiguard.model.EvidenceType;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class EvidenceRequest {
    @NotNull(message = "Evidence type is required")
    private EvidenceType type;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "File URL is required")
    private String fileUrl;
}
