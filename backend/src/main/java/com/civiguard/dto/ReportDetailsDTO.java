package com.civiguard.dto;

import com.civiguard.model.Report;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDetailsDTO {
    private String witnesses;
    private String evidence;
    private String reportDate;
    private String reportTime;
    private String originalDescription;
    private String originalType;
    private Report.ReportStatus originalStatus;
    private String conversionNotes;
}
