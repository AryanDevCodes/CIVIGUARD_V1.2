package com.civiguard.repository;

import com.civiguard.model.Report;
import com.civiguard.model.Report.ReportStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Repository
public class ReportRepositoryImpl implements ReportRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Report> findReportsWithAssociations(
            String search,
            ReportStatus status,
            String type,
            String priority,
            Long createdBy,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            int limit,
            int offset) {
        
        var cb = entityManager.getCriteriaBuilder();
        var cq = cb.createQuery(Report.class);
        var report = cq.from(Report.class);
        
        // Join the required associations
        report.fetch("createdBy", JoinType.LEFT);
        
        // Build the where clause
        List<Predicate> predicates = new ArrayList<>();
        
        if (search != null && !search.isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(report.get("title")), searchPattern),
                cb.like(cb.lower(report.get("description")), searchPattern)
            ));
        }
        
        if (status != null) {
            predicates.add(cb.equal(report.get("status"), status));
        }
        
        if (type != null && !type.isEmpty()) {
            predicates.add(cb.equal(cb.lower(report.get("type")), type.toLowerCase()));
        }
        
        if (priority != null && !priority.isEmpty()) {
            predicates.add(cb.equal(cb.lower(report.get("priority")), priority.toLowerCase()));
        }
        
        if (createdBy != null) {
            predicates.add(cb.equal(report.get("createdBy").get("id"), createdBy));
        }
        
        if (dateFrom != null) {
            predicates.add(cb.greaterThanOrEqualTo(report.get("createdAt"), dateFrom));
        }
        
        if (dateTo != null) {
            predicates.add(cb.lessThanOrEqualTo(report.get("createdAt"), dateTo));
        }
        
        cq.where(predicates.toArray(new Predicate[0]));
        
        // Add sorting
        cq.orderBy(cb.desc(report.get("createdAt")));
        
        // Create and execute the query
        TypedQuery<Report> query = entityManager.createQuery(cq);
        query.setFirstResult(offset);
        query.setMaxResults(limit);
        
        return query.getResultList();
    }
    
    @Override
    public long countReportsWithAssociations(
            String search,
            ReportStatus status,
            String type,
            String priority,
            Long createdBy,
            LocalDateTime dateFrom,
            LocalDateTime dateTo) {
            
        var cb = entityManager.getCriteriaBuilder();
        var cq = cb.createQuery(Long.class);
        var report = cq.from(Report.class);
        
        // Build the where clause
        List<Predicate> predicates = new ArrayList<>();
        
        if (search != null && !search.isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(report.get("title")), searchPattern),
                cb.like(cb.lower(report.get("description")), searchPattern)
            ));
        }
        
        if (status != null) {
            predicates.add(cb.equal(report.get("status"), status));
        }
        
        if (type != null && !type.isEmpty()) {
            predicates.add(cb.equal(cb.lower(report.get("type")), type.toLowerCase()));
        }
        
        if (priority != null && !priority.isEmpty()) {
            predicates.add(cb.equal(cb.lower(report.get("priority")), priority.toLowerCase()));
        }
        
        if (createdBy != null) {
            predicates.add(cb.equal(report.get("createdBy").get("id"), createdBy));
        }
        
        if (dateFrom != null) {
            predicates.add(cb.greaterThanOrEqualTo(report.get("createdAt"), dateFrom));
        }
        
        if (dateTo != null) {
            predicates.add(cb.lessThanOrEqualTo(report.get("createdAt"), dateTo));
        }
        
        cq.select(cb.count(report));
        cq.where(predicates.toArray(new Predicate[0]));
        
        return entityManager.createQuery(cq).getSingleResult();
    }
}
