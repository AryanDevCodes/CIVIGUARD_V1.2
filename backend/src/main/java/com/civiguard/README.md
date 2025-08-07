
# CiviGuard Backend Code Structure

This document explains the structure and organization of the CiviGuard backend codebase.

## Package Structure

- `com.civiguard.config`: Configuration classes for the application
- `com.civiguard.controller`: REST controllers that handle API requests
- `com.civiguard.dto`: Data Transfer Objects for API requests and responses
- `com.civiguard.exception`: Custom exceptions and global exception handler
- `com.civiguard.model`: Entity classes representing database tables
- `com.civiguard.repository`: JPA repositories for database operations
- `com.civiguard.security`: Security-related classes (JWT, authentication, etc.)
- `com.civiguard.service`: Business logic services

## Key Components

### Models

- `User`: Core user entity with role-based permissions
- `Officer`: Law enforcement officer entity
- `Incident`: Public safety incident entity
- `Alert`: Public safety alert entity
- `SystemStatus`: System component status tracking

### Controllers

- `AuthController`: Authentication endpoints
- `IncidentController`: Incident management endpoints
- `OfficerController`: Officer management endpoints
- `AlertController`: Safety alert endpoints
- `SystemController`: System monitoring endpoints
- `NotificationController`: User notification endpoints

### Services

- `AuthService`: Authentication and user registration logic
- `IncidentService`: Incident management logic
- `OfficerService`: Officer management logic
- `AlertService`: Safety alert logic
- `SystemStatusService`: System monitoring logic
- `NotificationService`: Notification delivery and management logic

### Security

- `JwtTokenProvider`: JWT token generation and validation
- `JwtAuthenticationFilter`: Request filter for JWT authentication
- `UserPrincipal`: Custom UserDetails implementation
- `SecurityConfig`: Security configuration and endpoint protection

## Database Schema

The application uses a relational database with the following core tables:

- `users`: User accounts with role-based permissions
- `officers`: Officer information linked to user accounts
- `incidents`: Safety incidents reported by citizens
- `alerts`: Safety alerts broadcasted to citizens
- `system_status`: Status of system components
- `notifications`: User notifications
- `emergency_contacts`: User emergency contacts
- `incident_updates`: Updates to incident reports
- `incident_officers`: Many-to-many relationship between incidents and officers

## API Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

For error responses:

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

## Authentication Flow

1. User registers using `/auth/register` endpoint
2. User logs in using `/auth/login` endpoint
3. Backend validates credentials and returns JWT token
4. Client includes token in Authorization header for subsequent requests
5. `JwtAuthenticationFilter` validates the token for each request
6. Endpoint access is controlled by Spring Security based on user role

## Custom Exception Handling

The application uses a global exception handler (`GlobalExceptionHandler`) to catch and process exceptions, providing consistent API error responses with appropriate HTTP status codes.
