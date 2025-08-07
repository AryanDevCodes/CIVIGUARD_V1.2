package com.civiguard.dto.officer;

import lombok.Data;

import java.time.LocalDate;

@Data
public class OfficerPerformanceResponse {
    private int casesSolved;
    private int commendations;
    private int incidentsReported;
    private String performanceRating;
    private LocalDate lastPromotionDate;
    private int awardsReceived;
    private int disciplinaryActions;
    private int trainingHoursCompleted;
    private int communityEngagementScore;
    private int teamLeadershipScore;
    private double performanceScore;

    public static OfficerPerformanceResponse fromEntity(com.civiguard.model.OfficerPerformance performance) {
        if (performance == null) {
            return new OfficerPerformanceResponse();
        }
        
        OfficerPerformanceResponse response = new OfficerPerformanceResponse();
        response.setCasesSolved(performance.getCasesSolved());
        response.setCommendations(performance.getCommendations());
        response.setIncidentsReported(performance.getIncidentsReported());
        response.setPerformanceRating(performance.getPerformanceRating());
        response.setLastPromotionDate(performance.getLastPromotionDate());
        response.setAwardsReceived(performance.getAwardsReceived());
        response.setDisciplinaryActions(performance.getDisciplinaryActions());
        response.setTrainingHoursCompleted(performance.getTrainingHoursCompleted());
        response.setCommunityEngagementScore(performance.getCommunityEngagementScore());
        response.setTeamLeadershipScore(performance.getTeamLeadershipScore());
        response.setPerformanceScore(performance.calculatePerformanceScore());
        
        return response;
    }
}
