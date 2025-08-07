# System Monitoring Documentation

This document provides an overview of the system monitoring features implemented in the CiviGuard backend.

## Features

1. **System Metrics**
   - Memory usage (total, used, free)
   - CPU usage (load average, core count)
   - Disk usage (total, used, free)
   - Timestamp of the metrics collection

2. **System Logs**
   - View application logs in real-time
   - Pagination support for log entries
   - Filtering by log level and component

## API Endpoints

### Get System Metrics

```
GET /admin/system/metrics
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "memory": {
      "total": 17179869184,
      "used": 8589934592,
      "free": 8589934592
    },
    "cpu": {
      "load": 0.75,
      "cores": 8
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200
    },
    "timestamp": "2023-04-01T12:34:56.789Z"
  }
}
```

### Get System Logs

```
GET /admin/system/logs?page=0&size=50
```

**Query Parameters:**
- `page`: Page number (0-based, default: 0)
- `size`: Number of items per page (default: 50)

**Response:**
```json
{
  "status": "success",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2023-04-01 12:34:56.789",
        "level": "INFO",
        "component": "com.civiguard.service.SystemMonitoringService",
        "message": "System metrics collected successfully"
      }
    ],
    "pageable": {
      "sort": {
        "sorted": false,
        "unsorted": true,
        "empty": true
      },
      "offset": 0,
      "pageNumber": 0,
      "pageSize": 50,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "size": 50,
    "number": 0,
    "sort": {
      "sorted": false,
      "unsorted": true,
      "empty": true
    },
    "numberOfElements": 1,
    "first": true,
    "empty": false
  }
}
```

## Logging Configuration

Logs are configured to be written to `logs/application.log` with the following rotation settings:
- Maximum log file size: 10MB
- Maximum history: 30 days
- Total size cap: 1GB

Log levels:
- Root: INFO
- com.civiguard: DEBUG
- org.springframework.web: INFO
- org.hibernate.SQL: WARN

## Security

All system monitoring endpoints are secured and require the `ADMIN` role to access. Make sure to authenticate with a user account that has the appropriate permissions.

## Troubleshooting

1. **Logs not appearing in the UI**
   - Check if the application has write permissions to the `logs` directory
   - Verify that the log level is set appropriately (DEBUG for development, INFO for production)
   - Check the application logs for any errors

2. **Metrics not showing up**
   - Ensure that the application has the necessary permissions to access system metrics
   - Check if the `com.sun.management` module is available in the JVM

3. **High disk usage**
   - The logs are automatically rotated and compressed when they reach 10MB
   - Only the last 30 days of logs are kept
   - The total log size is capped at 1GB
