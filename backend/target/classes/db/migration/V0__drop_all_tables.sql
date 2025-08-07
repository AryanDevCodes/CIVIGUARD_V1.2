-- Drop all tables in the correct order to avoid foreign key constraint violations

-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS disaster_emergency_contacts CASCADE;
DROP TABLE IF EXISTS disaster_evacuation_centers CASCADE;
DROP TABLE IF EXISTS disaster_affected_areas CASCADE;
DROP TABLE IF EXISTS disaster_alerts CASCADE;
DROP TABLE IF EXISTS incident_updates CASCADE;
DROP TABLE IF EXISTS incident_officers CASCADE;
DROP TABLE IF EXISTS report_officers CASCADE;
DROP TABLE IF EXISTS incident_images CASCADE;
DROP TABLE IF EXISTS incident_tags CASCADE;
DROP TABLE IF EXISTS geofence_polygon_points CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;

-- Drop main entity tables
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS patrol_vehicles CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;
DROP TABLE IF EXISTS system_status CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS location_type CASCADE;
