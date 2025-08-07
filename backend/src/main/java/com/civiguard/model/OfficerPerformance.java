package com.civiguard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Embedded entity to track performance metrics for an officer.
 * This is embedded within the Officer entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class OfficerPerformance {
    
    @Column(name = "cases_solved", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int casesSolved = 0;
    
    @Column(name = "commendations_received", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int commendations = 0;
    
    @Column(name = "incidents_reported", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int incidentsReported = 0;
    
    @Column(name = "performance_rating", length = 2, columnDefinition = "VARCHAR(2) DEFAULT 'C'")
    private String performanceRating = "C"; // A, B, C, D
    
    @Column(name = "last_promotion_date")
    @Temporal(TemporalType.DATE)
    private LocalDate lastPromotionDate;
    
    @Column(name = "awards_received", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int awardsReceived = 0;
    
    @Column(name = "disciplinary_actions", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int disciplinaryActions = 0;
    
    @Column(name = "training_hours_completed", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int trainingHoursCompleted = 0;
    
    @Column(name = "community_engagement_score", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int communityEngagementScore = 0;
    
    @Column(name = "team_leadership_score", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int teamLeadershipScore = 0;
    
    /**
     * Calculates the overall performance score based on various metrics.
     * @return A score between 0 and 100
     */
    public double calculatePerformanceScore() {
        double score = 0;
        
        // Base score from performance rating (A=100, B=80, C=60, D=40)
        if (performanceRating != null) {
            switch (performanceRating.toUpperCase()) {
                case "A": score += 100; break;
                case "B": score += 80; break;
                case "C": score += 60; break;
                case "D": score += 40; break;
                default: score += 50; // Default to average
            }
        } else {
            score += 50;
        }
        
        // Adjust based on commendations and disciplinary actions
        score += (commendations * 2); // +2 points per commendation
        score -= (disciplinaryActions * 5); // -5 points per disciplinary action
        
        // Cap the score between 0 and 100
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Updates the performance rating based on the calculated score.
     */
    public void updatePerformanceRating() {
        double score = calculatePerformanceScore();
        if (score >= 90) {
            performanceRating = "A";
        } else if (score >= 75) {
            performanceRating = "B";
        } else if (score >= 50) {
            performanceRating = "C";
        } else {
            performanceRating = "D";
        }
    }
}