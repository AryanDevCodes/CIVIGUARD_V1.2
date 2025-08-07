-- Add status column as ENUM
ALTER TABLE reports 
MODIFY COLUMN status ENUM('PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CONVERTED') NOT NULL DEFAULT 'PENDING';

-- Add new timestamp columns
ALTER TABLE reports
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN resolution_notes TEXT;

-- Create junction table for report_officers many-to-many relationship
CREATE TABLE IF NOT EXISTS report_officers (
    report_id BIGINT NOT NULL,
    officer_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id, officer_id),
    CONSTRAINT fk_report_officers_report
        FOREIGN KEY (report_id) REFERENCES reports (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_report_officers_officer
        FOREIGN KEY (officer_id) REFERENCES officers (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better query performance
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_report_officers_officer_id ON report_officers(officer_id);
