package com.civiguard.aspect;

import com.civiguard.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditLogAspect {
    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterReturning(
        pointcut = "execution(* com.civiguard.service.*Service.save*(..)) || execution(* com.civiguard.service.*Service.update*(..)) || execution(* com.civiguard.service.*Service.delete*(..))",
        returning = "result"
    )
    public void logAfterChange(JoinPoint joinPoint, Object result) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String methodName = signature.getName();
        String entity = signature.getDeclaringType().getSimpleName().replace("Service", "");
        String action = methodName.startsWith("save") ? "CREATE" : methodName.startsWith("update") ? "UPDATE" : "DELETE";

        Object[] args = joinPoint.getArgs();
        Object oldValue = null;
        Object newValue = null;
        String entityId = null;

        // Try to extract entityId and old/new values (customize as needed)
        if (args.length > 0) {
            // For update/delete, assume first arg is ID or entity
            if (action.equals("UPDATE") || action.equals("DELETE")) {
                entityId = args[0].toString();
                oldValue = args[0]; // Optionally fetch from DB for richer data
            }
            // For create/update, result is new value
            if (action.equals("CREATE") || action.equals("UPDATE")) {
                newValue = result;
            }
        }

        // Use a real userId from security context if available
        Long userId = null; // TODO: fetch from SecurityContext if using Spring Security

        auditLogService.log(
            userId,
            entity,
            entityId,
            action,
            oldValue,
            newValue,
            "Auto-logged by AuditLogAspect"
        );
    }
}