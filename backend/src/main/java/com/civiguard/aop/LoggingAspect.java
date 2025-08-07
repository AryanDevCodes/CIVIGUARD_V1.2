package com.civiguard.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Objects;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around("execution(* com.civiguard.controller..*(..)) && " +
            "(@annotation(org.springframework.web.bind.annotation.GetMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PatchMapping))")
    public Object logControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) Objects.requireNonNull(
                RequestContextHolder.getRequestAttributes())).getRequest();

        // Get method info
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();
        
        // Log request
        log.info("\n=== API Request ===\n" +
                "Method: {} {}\n" +
                "Controller: {}.{}\n" +
                "Arguments: {}",
                request.getMethod(),
                getRequestUrl(request),
                className,
                methodName,
                Arrays.toString(joinPoint.getArgs()));

        // Measure method execution time
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        try {
            // Execute the method
            Object result = joinPoint.proceed();
            stopWatch.stop();
            
            // Log successful response
            log.info("\n=== API Response ===\n" +
                    "Method: {} {}\n" +
                    "Controller: {}.{}\n" +
                    "Execution Time: {} ms\n" +
                    "Status: {}",
                    request.getMethod(),
                    getRequestUrl(request),
                    className,
                    methodName,
                    stopWatch.getTotalTimeMillis(),
                    "SUCCESS");
            
            return result;
            
        } catch (Exception ex) {
            stopWatch.stop();
            
            // Log error response
            log.error("\n=== API Error ===\n" +
                    "Method: {} {}\n" +
                    "Controller: {}.{}\n" +
                    "Execution Time: {} ms\n" +
                    "Status: {}\n" +
                    "Error: {}",
                    request.getMethod(),
                    getRequestUrl(request),
                    className,
                    methodName,
                    stopWatch.getTotalTimeMillis(),
                    "ERROR",
                    ex.getMessage(),
                    ex);
                    
            throw ex; // Re-throw the exception for the GlobalExceptionHandler to handle
        }
    }
    
    private String getRequestUrl(HttpServletRequest request) {
        String queryString = request.getQueryString();
        return request.getRequestURI() + (queryString != null ? "?" + queryString : "");
    }
}
