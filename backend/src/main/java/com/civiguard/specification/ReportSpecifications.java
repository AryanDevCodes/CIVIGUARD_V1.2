package com.civiguard.specification;

import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Component
public class ReportSpecifications {
    
    public static Specification<Report> hasTitleContaining(String title) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("title")), 
                "%" + title.toLowerCase() + "%"
            );
    }
    
    public static Specification<Report> hasDescriptionContaining(String description) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("description")), 
                "%" + description.toLowerCase() + "%"
            );
    }
    
    public static Specification<Report> hasStatus(ReportStatus status) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), status);
    }
    
    public static Specification<Report> createdByUser(Long userId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("createdBy").get("id"), userId);
    }
    
    public static Specification<Report> assignedToOfficer(Long officerId) {
        return (root, query, criteriaBuilder) -> {
            query.distinct(true);
            return criteriaBuilder.equal(
                root.join("assignedOfficers").get("id"), 
                officerId
            );
        };
    }
    
    public static Specification<Report> withFilters(
            String searchQuery, 
            ReportStatus status,
            Long createdById,
            Long assignedToId) {
                
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                String searchTerm = "%" + searchQuery.toLowerCase() + "%";
                predicates.add(
                    criteriaBuilder.or(
                        criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("title")), searchTerm),
                        criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("description")), searchTerm)
                    )
                );
            }
            
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            if (createdById != null) {
                predicates.add(
                    criteriaBuilder.equal(root.get("createdBy").get("id"), createdById)
                );
            }
            
            if (assignedToId != null) {
                predicates.add(
                    criteriaBuilder.equal(
                        root.join("assignedOfficers").get("id"), 
                        assignedToId
                    )
                );
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
