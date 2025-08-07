-- Database schema for Civiguard application
-- This script creates all necessary tables and relationships

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',
    verification_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
    profile_image VARCHAR(255),
    phone_number VARCHAR(20),
    aadhaar VARCHAR(12) UNIQUE NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Address table (embedded in User)
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS street VARCHAR(255),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS landmark VARCHAR(255),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Officers
CREATE TABLE IF NOT EXISTS officers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(50),
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    district VARCHAR(100),
    join_date DATE,
    avatar VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    cases_solved INT DEFAULT 0,
    commendations INT DEFAULT 0,
    incidents_reported INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location type for spatial data
CREATE TYPE location_type AS (
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100)
);

-- Patrol Vehicles
CREATE TABLE IF NOT EXISTS patrol_vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50),
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    current_location_latitude DOUBLE PRECISION,
    current_location_longitude DOUBLE PRECISION,
    last_location_update TIMESTAMP,
    assigned_officer_id BIGINT REFERENCES officers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GeoFences
CREATE TABLE IF NOT EXISTS geofences (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    radius_km DOUBLE PRECISION,
    center_latitude DOUBLE PRECISION,
    center_longitude DOUBLE PRECISION,
    purpose VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GeoFence Polygon Points
CREATE TABLE IF NOT EXISTS geofence_polygon_points (
    id BIGSERIAL PRIMARY KEY,
    geofence_id BIGINT REFERENCES geofences(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    point_order INT NOT NULL
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    reported_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    reporter_contact_info VARCHAR(100),
    status VARCHAR(30) DEFAULT 'REPORTED',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    incident_type VARCHAR(100) NOT NULL,
    report_date TIMESTAMP,
    resolution_date TIMESTAMP,
    resolution_notes TEXT,
    report_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident Images
CREATE TABLE IF NOT EXISTS incident_images (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident Tags
CREATE TABLE IF NOT EXISTS incident_tags (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident Updates
CREATE TABLE IF NOT EXISTS incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident Officers (Many-to-Many)
CREATE TABLE IF NOT EXISTS incident_officers (
    incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
    officer_id BIGINT REFERENCES officers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (incident_id, officer_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Report Officers (Many-to-Many)
CREATE TABLE IF NOT EXISTS report_officers (
    report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
    officer_id BIGINT REFERENCES officers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id, officer_id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    radius_km DOUBLE PRECISION,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disaster Alerts
CREATE TABLE IF NOT EXISTS disaster_alerts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    severity VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    impact_radius_km DOUBLE PRECISION,
    start_time TIMESTAMP,
    estimated_end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disaster Affected Areas
CREATE TABLE IF NOT EXISTS disaster_affected_areas (
    disaster_id BIGINT REFERENCES disaster_alerts(id) ON DELETE CASCADE,
    area VARCHAR(255) NOT NULL,
    PRIMARY KEY (disaster_id, area)
);

-- Disaster Evacuation Centers
CREATE TABLE IF NOT EXISTS disaster_evacuation_centers (
    disaster_id BIGINT REFERENCES disaster_alerts(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(500),
    district VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India'
);

-- Disaster Emergency Contacts
CREATE TABLE IF NOT EXISTS disaster_emergency_contacts (
    disaster_id BIGINT REFERENCES disaster_alerts(id) ON DELETE CASCADE,
    contact VARCHAR(100) NOT NULL,
    PRIMARY KEY (disaster_id, contact)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Status
CREATE TABLE IF NOT EXISTS system_status (
    id BIGSERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather Data
CREATE TABLE IF NOT EXISTS weather_data (
    id BIGSERIAL PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    wind_speed DOUBLE PRECISION,
    weather_condition VARCHAR(100),
    precipitation DOUBLE PRECISION,
    visibility DOUBLE PRECISION,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    forecast_time TIMESTAMP,
    is_warning_active BOOLEAN,
    warning_type VARCHAR(100),
    warning_description TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_district ON weather_data(district);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON weather_data(timestamp);

-- Enable Row Level Security (RLS) for future security enhancements
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
