-- Initial data load for Civiguard application
-- This script populates the database with test data

-- Insert system status
INSERT INTO system_status (component_name, status, description, version) VALUES 
('API', 'OPERATIONAL', 'Main API service', '1.0.0'),
('Database', 'OPERATIONAL', 'PostgreSQL database', '13.7'),
('Authentication', 'OPERATIONAL', 'JWT Authentication', '1.0.0'),
('Notification', 'OPERATIONAL', 'Email and SMS notifications', '1.0.0'),
('Geofencing', 'OPERATIONAL', 'Geofencing service', '1.0.0'),
('Weather', 'OPERATIONAL', 'Weather data service', '1.0.0');

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, role, verification_status, phone_number, aadhaar, is_active, created_at, updated_at)
VALUES ('Admin User', 'admin@civiguard.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'ADMIN', 'VERIFIED', '9876543210', '123456789012', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert police users (password: police123)
INSERT INTO users (name, email, password, role, verification_status, phone_number, aadhaar, is_active, created_at, updated_at)
VALUES 
('Police Officer 1', 'officer1@civiguard.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'POLICE', 'VERIFIED', '9876543211', '123456789013', TRUE, NOW(), NOW()),
('Police Officer 2', 'officer2@civiguard.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'POLICE', 'VERIFIED', '9876543212', '123456789014', TRUE, NOW(), NOW()),
('Police Officer 3', 'officer3@civiguard.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'POLICE', 'VERIFIED', '9876543213', '123456789015', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert regular users (password: user123)
INSERT INTO users (name, email, password, role, verification_status, phone_number, aadhaar, is_active, street, city, state, postal_code, created_at, updated_at)
VALUES 
('John Doe', 'john.doe@example.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'CITIZEN', 'VERIFIED', '9876543220', '123456789016', TRUE, '123 Main St', 'Mumbai', 'Maharashtra', '400001', NOW(), NOW()),
('Jane Smith', 'jane.smith@example.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'CITIZEN', 'VERIFIED', '9876543221', '123456789017', TRUE, '456 Park Ave', 'Delhi', 'Delhi', '110001', NOW(), NOW()),
('Rahul Sharma', 'rahul.sharma@example.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'CITIZEN', 'PENDING', '9876543222', '123456789018', TRUE, '789 MG Road', 'Bangalore', 'Karnataka', '560001', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert officers
INSERT INTO officers (name, badge_number, rank, department, status, district, join_date, user_id, cases_solved, commendations, incidents_reported)
VALUES 
('Police Officer 1', 'PD12345', 'Inspector', 'Traffic', 'ACTIVE', 'Mumbai', '2020-01-15', (SELECT id FROM users WHERE email = 'officer1@civiguard.com'), 45, 5, 120),
('Police Officer 2', 'PD12346', 'Sub-Inspector', 'Crime', 'ACTIVE', 'Delhi', '2021-03-22', (SELECT id FROM users WHERE email = 'officer2@civiguard.com'), 32, 3, 85),
('Police Officer 3', 'PD12347', 'Head Constable', 'Traffic', 'ACTIVE', 'Bangalore', '2019-11-05', (SELECT id FROM users WHERE email = 'officer3@civiguard.com'), 28, 2, 95)
ON CONFLICT (badge_number) DO NOTHING;

-- Insert emergency contacts
INSERT INTO emergency_contacts (name, phone_number, relationship, user_id)
VALUES 
('Emergency Contact 1', '9876543330', 'Spouse', (SELECT id FROM users WHERE email = 'john.doe@example.com')),
('Emergency Contact 2', '9876543331', 'Parent', (SELECT id FROM users WHERE email = 'jane.smith@example.com')),
('Emergency Contact 3', '9876543332', 'Sibling', (SELECT id FROM users WHERE email = 'rahul.sharma@example.com'))
ON CONFLICT (user_id, phone_number) DO NOTHING;

-- Insert patrol vehicles
INSERT INTO patrol_vehicles (vehicle_number, type, model, status, current_location_latitude, current_location_longitude, last_location_update, assigned_officer_id)
VALUES 
('MH01AB1234', 'Patrol Car', 'Mahindra Scorpio', 'ACTIVE', 19.0760, 72.8777, NOW(), (SELECT id FROM officers WHERE badge_number = 'PD12345')),
('DL02CD5678', 'Patrol Bike', 'Bajaj Pulsar', 'ACTIVE', 28.6139, 77.2090, NOW(), (SELECT id FROM officers WHERE badge_number = 'PD12346')),
('KA03EF9012', 'Patrol Car', 'Tata Safari', 'ACTIVE', 12.9716, 77.5946, NOW(), (SELECT id FROM officers WHERE badge_number = 'PD12347'))
ON CONFLICT (vehicle_number) DO NOTHING;

-- Insert geofences
WITH new_geofence AS (
  INSERT INTO geofences (name, description, type, radius_km, center_latitude, center_longitude, purpose, start_time, end_time, is_active, created_by_id)
  VALUES 
  ('Mumbai High Alert Zone', 'High security area in Mumbai', 'CIRCLE', 2.0, 19.0760, 72.8777, 'SECURITY', NOW(), NOW() + INTERVAL '1 year', TRUE, (SELECT id FROM users WHERE email = 'admin@civiguard.com'))
  RETURNING id
)
INSERT INTO geofence_polygon_points (geofence_id, latitude, longitude, point_order)
SELECT id, 19.0860, 72.8677, 1 FROM new_geofence
UNION ALL
SELECT id, 19.0860, 72.8877, 2 FROM new_geofence
UNION ALL
SELECT id, 19.0660, 72.8877, 3 FROM new_geofence
UNION ALL
SELECT id, 19.0660, 72.8677, 4 FROM new_geofence
ON CONFLICT DO NOTHING;

-- Insert incidents
INSERT INTO incidents (title, description, latitude, longitude, address, district, city, state, postal_code, reported_by_id, is_anonymous, status, priority, incident_type, report_date, created_at, updated_at)
VALUES 
('Traffic Violation', 'Car running red light at Main Street', 19.0760, 72.8777, 'Main Street, Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400001', (SELECT id FROM users WHERE email = 'john.doe@example.com'), FALSE, 'REPORTED', 'MEDIUM', 'TRAFFIC_VIOLATION', NOW(), NOW(), NOW()),
('Suspicious Activity', 'Unattended bag at train station', 28.6139, 77.2090, 'New Delhi Railway Station', 'Central Delhi', 'Delhi', 'Delhi', '110001', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), FALSE, 'INVESTIGATING', 'HIGH', 'SUSPICIOUS_ACTIVITY', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
('Public Disturbance', 'Loud noise and fighting in apartment', 12.9716, 77.5946, 'MG Road, Bangalore', 'Bangalore Urban', 'Bangalore', 'Karnataka', '560001', (SELECT id FROM users WHERE email = 'rahul.sharma@example.com'), TRUE, 'RESOLVED', 'LOW', 'PUBLIC_DISTURBANCE', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours')
RETURNING id INTO incident_ids;

-- Assign officers to incidents
INSERT INTO incident_officers (incident_id, officer_id, assigned_at)
SELECT i.id, o.id, NOW()
FROM incidents i
CROSS JOIN (SELECT id FROM officers LIMIT 1) o
WHERE i.id IN (SELECT id FROM incidents)
ON CONFLICT DO NOTHING;

-- Insert incident updates
INSERT INTO incident_updates (incident_id, content, updated_by_id, created_at)
SELECT id, 'Initial report filed', (SELECT id FROM users WHERE email = 'admin@civiguard.com'), NOW()
FROM incidents
ON CONFLICT DO NOTHING;

-- Insert reports
INSERT INTO reports (title, description, type, status, latitude, longitude, address, district, city, state, postal_code, created_by_id, created_at, updated_at)
VALUES 
('Damaged Traffic Light', 'Traffic light at Main St and 1st Ave is not working', 'INFRASTRUCTURE', 'OPEN', 19.0760, 72.8777, 'Main St and 1st Ave, Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400001', (SELECT id FROM users WHERE email = 'john.doe@example.com'), NOW(), NOW()),
('Illegal Parking', 'Cars parked in no-parking zone', 'TRAFFIC', 'IN_PROGRESS', 28.6139, 77.2090, 'Connaught Place, New Delhi', 'Central Delhi', 'Delhi', 'Delhi', '110001', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
('Street Light Outage', 'Street light not working in front of building', 'INFRASTRUCTURE', 'RESOLVED', 12.9716, 77.5946, 'Brigade Road, Bangalore', 'Bangalore Urban', 'Bangalore', 'Karnataka', '560001', (SELECT id FROM users WHERE email = 'rahul.sharma@example.com'), NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert alerts
INSERT INTO alerts (title, description, severity, latitude, longitude, address, district, city, state, postal_code, radius_km, start_time, end_time, is_active, created_by_id, created_at, updated_at)
VALUES 
('Traffic Diversion', 'Heavy traffic on MG Road, use alternate routes', 'MEDIUM', 19.0760, 72.8777, 'MG Road, Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400001', 5.0, NOW(), NOW() + INTERVAL '6 hours', TRUE, (SELECT id FROM users WHERE email = 'officer1@civiguard.com'), NOW(), NOW()),
('Water Logging', 'Heavy rain causing water logging in low-lying areas', 'HIGH', 28.6139, 77.2090, 'Connaught Place, New Delhi', 'Central Delhi', 'Delhi', 'Delhi', '110001', 10.0, NOW(), NOW() + INTERVAL '12 hours', TRUE, (SELECT id FROM users WHERE email = 'officer2@civiguard.com'), NOW(), NOW()),
('Protest March', 'Scheduled protest march on Brigade Road', 'LOW', 12.9716, 77.5946, 'Brigade Road, Bangalore', 'Bangalore Urban', 'Bangalore', 'Karnataka', '560001', 2.0, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 4 hours', TRUE, (SELECT id FROM users WHERE email = 'officer3@civiguard.com'), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert disaster alerts
WITH disaster AS (
  INSERT INTO disaster_alerts (title, description, type, severity, latitude, longitude, address, district, city, state, postal_code, impact_radius_km, start_time, estimated_end_time, is_active, created_by_id, created_at, updated_at)
  VALUES 
  ('Cyclone Warning', 'Cyclone expected to make landfall in 48 hours', 'CYCLONE', 'CRITICAL', 19.0760, 72.8777, 'Coastal Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400001', 100.0, NOW(), NOW() + INTERVAL '3 days', TRUE, (SELECT id FROM users WHERE email = 'admin@civiguard.com'), NOW(), NOW())
  RETURNING id
)
INSERT INTO disaster_affected_areas (disaster_id, area)
SELECT id, 'Coastal Areas' FROM disaster
UNION ALL
SELECT id, 'Low-lying Areas' FROM disaster
UNION ALL
SELECT id, 'Eastern Suburbs' FROM disaster
ON CONFLICT DO NOTHING;

-- Insert disaster evacuation centers
INSERT INTO disaster_evacuation_centers (disaster_id, latitude, longitude, address, district, city, state, postal_code)
SELECT id, 19.0960, 72.8977, 'Mumbai High School', 'Mumbai', 'Mumbai', 'Maharashtra', '400001'
FROM disaster_alerts
WHERE title = 'Cyclone Warning'
ON CONFLICT DO NOTHING;

-- Insert disaster emergency contacts
INSERT INTO disaster_emergency_contacts (disaster_id, contact)
SELECT id, 'Disaster Management: 1800-123-4567'
FROM disaster_alerts
WHERE title = 'Cyclone Warning'
UNION ALL
SELECT id, 'Emergency Helpline: 108'
FROM disaster_alerts
WHERE title = 'Cyclone Warning'
ON CONFLICT DO NOTHING;

-- Insert notifications
INSERT INTO notifications (message, type, is_read, user_id, created_at)
SELECT 'Your report #' || id || ' has been received', 'REPORT', FALSE, created_by_id, created_at
FROM reports
WHERE status = 'OPEN'
UNION ALL
SELECT 'Update on incident #' || id || ': Under investigation', 'INCIDENT', FALSE, reported_by_id, created_at
FROM incidents
WHERE status = 'INVESTIGATING'
ON CONFLICT DO NOTHING;

-- Insert weather data
INSERT INTO weather_data (district, temperature, humidity, wind_speed, weather_condition, precipitation, visibility, timestamp, forecast_time, is_warning_active, warning_type, warning_description)
VALUES 
('Mumbai', 28.5, 75.0, 15.2, 'Partly Cloudy', 0.0, 10.0, NOW(), NOW(), FALSE, NULL, NULL),
('Delhi', 35.2, 45.0, 10.5, 'Sunny', 0.0, 12.0, NOW(), NOW(), TRUE, 'HEAT_WAVE', 'Heat wave warning in effect'),
('Bangalore', 22.8, 85.0, 8.7, 'Light Rain', 2.5, 8.0, NOW(), NOW(), FALSE, NULL, NULL)
ON CONFLICT (district, forecast_time) DO NOTHING;
