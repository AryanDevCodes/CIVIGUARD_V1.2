
# CiviGuard Backend

This is the Spring Boot backend for the CiviGuard public safety management platform, specifically designed for the Indian context.

## Features

- User Authentication & Authorization
- Officer Management
- Incident Reporting (including anonymous reporting)
- Real-time Communication via WebSocket
- Weather & Disaster Alerts
- Geofencing Capabilities
- Vehicle Patrol Management
- Multi-language Support for Indian Languages
- System Status Monitoring
- Notification System

## Tech Stack

- Java 21
- Spring Boot 3.2.1
- PostgreSQL
- JWT Authentication
- Spring Security
- Spring Data JPA
- WebSocket for Real-time Communication
- OpenAPI Documentation

## Getting Started

### Prerequisites

- JDK 21 or higher
- Maven
- PostgreSQL

### Setup Database

Create a PostgreSQL database:

```sql
CREATE DATABASE civiguard;
```

### Configuration

Application configuration is located in:
- `application.yml` (default configuration)
- `application-dev.yml` (development profile)
- `application-prod.yml` (production profile)

Customize the database connection and other properties as needed.

### Build & Run

```bash
# Build the project
mvn clean install

# Run with development profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### API Documentation

Once the application is running, access the Swagger UI at:
http://localhost:8080/api/swagger-ui.html

## Project Structure

- `com.civiguard.controller`: REST API controllers
- `com.civiguard.service`: Business logic services
- `com.civiguard.repository`: Data access repositories
- `com.civiguard.model`: Domain entities
- `com.civiguard.dto`: Data Transfer Objects
- `com.civiguard.security`: Security configuration
- `com.civiguard.exception`: Exception handling
- `com.civiguard.config`: Application configuration

## Security

The application uses JWT token-based authentication. All API endpoints are secured except:
- `/auth/**`: Authentication endpoints
- `/incidents/anonymous`: Anonymous incident reporting
- `/alerts/public`: Public safety alerts
- `/v3/api-docs/**`, `/swagger-ui/**`: API documentation

## WebSocket Endpoints

The application provides WebSocket endpoints for real-time communication:
- Connect to `/ws` using SockJS
- Subscribe to topics:
  - `/topic/incidents`: Real-time incident updates
  - `/topic/officer-locations`: Officer location updates
  - `/topic/vehicle-locations`: Patrol vehicle location updates
  - `/topic/disaster-alerts`: Emergency disaster alerts
  - `/user/{userId}/queue/notifications`: User-specific notifications

## Disaster Alert System

The disaster alert system integrates with weather APIs and provides real-time updates for:
- Natural disasters (earthquakes, floods, cyclones, etc.)
- Evacuation centers and emergency contacts
- Geographic impact zones

## Geofencing

The application supports geofencing capabilities:
- Creating circular and polygon geofences
- Checking if a location is within any active fence
- Attaching purposes to geofences (patrol areas, incident zones, etc.)

## Multi-language Support

The application includes support for major Indian languages:
- English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia

## Patrol Vehicle Tracking

Track and manage police vehicles with:
- Real-time location updates
- Officer assignments
- Vehicle status management

## Deployment

For production deployment, set the appropriate environment variables as defined in the `application-prod.yml` file.

## Contributing

Please follow the standard Git workflow:

1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request to the `develop` branch
