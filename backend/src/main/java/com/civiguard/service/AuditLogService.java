package com.civiguard.service;

import com.civiguard.model.AuditLog;
import com.civiguard.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {
    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public void log(Long userId, String entity, String entityId, String action, Object oldValue, Object newValue, String description) {
        try {
            AuditLog log = new AuditLog();
            log.setTimestamp(LocalDateTime.now());
            log.setUserId(userId);
            log.setEntity(entity);
            log.setEntityId(entityId);
            log.setAction(action);
            log.setOldValue(oldValue != null ? objectMapper.writeValueAsString(oldValue) : null);
            log.setNewValue(newValue != null ? objectMapper.writeValueAsString(newValue) : null);
            log.setDescription(description);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Optionally log error
            e.printStackTrace();
        }
    }
}
