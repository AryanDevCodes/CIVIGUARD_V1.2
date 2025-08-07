package com.civiguard.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ReportOperationException extends RuntimeException {
    public ReportOperationException(String message) {
        super(message);
    }

    public ReportOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
