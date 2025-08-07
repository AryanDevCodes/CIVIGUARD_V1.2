-- Drop existing shifts table if it exists
DROP TABLE IF EXISTS shifts CASCADE;

-- Create new shifts table with embedded location
CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    location_address VARCHAR(500),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_postal_code VARCHAR(20),
    location_country VARCHAR(100) DEFAULT 'India',
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    location_district VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create join table for shift officers
CREATE TABLE shift_officers (
    shift_id BIGINT NOT NULL,
    officer_id BIGINT NOT NULL,
    PRIMARY KEY (shift_id, officer_id),
    CONSTRAINT fk_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_officer FOREIGN KEY (officer_id) REFERENCES officers(id) ON DELETE CASCADE
);
