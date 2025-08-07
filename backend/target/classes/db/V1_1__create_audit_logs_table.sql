-- Migration: Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    user_id BIGINT,
    entity VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description VARCHAR(255)
);

-- Prevent deletion of audit logs
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Deletion from audit_logs is not allowed';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_logs;
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_delete();

-- Revoke DELETE privilege from PUBLIC
REVOKE DELETE ON audit_logs FROM PUBLIC;