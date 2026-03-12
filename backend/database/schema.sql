-- Training Staff Attendance Management System Database Schema
-- PostgreSQL Schema with UUID primary keys and proper indexing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation support

-- Users table (all roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'supervisor', 'trainee')) NOT NULL,
    department_id UUID REFERENCES departments(id),
    profile_image_url VARCHAR(500), -- Cloudinary URL
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    supervisor_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Programs/Courses
CREATE TABLE training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    schedule_config JSONB, -- flexible schedule storage
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Sessions (individual instances)
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES training_programs(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    qr_code VARCHAR(100) UNIQUE, -- generated unique code for check-in
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments (trainees assigned to programs)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_id UUID REFERENCES users(id),
    program_id UUID REFERENCES training_programs(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'withdrawn'))
);

-- Attendance Records (core table)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainee_id UUID REFERENCES users(id),
    session_id UUID REFERENCES training_sessions(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_method VARCHAR(20) CHECK (check_in_method IN ('qr_scan', 'geolocation', 'manual')),
    check_out_method VARCHAR(20) CHECK (check_out_method IN ('qr_scan', 'geolocation', 'manual')),
    check_in_location POINT, -- PostGIS point for geolocation
    status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN check_in_time IS NULL THEN 'absent'
            WHEN check_in_time > (session_date + start_time + INTERVAL '15 minutes') THEN 'late'
            ELSE 'present'
        END
    ) STORED,
    notes TEXT,
    verified_by UUID REFERENCES users(id), -- supervisor verification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trainee_id, session_id)
);

-- Correction Requests (for disputed attendance)
CREATE TABLE correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID REFERENCES attendance_records(id),
    requested_by UUID REFERENCES users(id),
    request_type VARCHAR(20) CHECK (request_type IN ('check_in', 'check_out', 'status_change')),
    requested_value TIMESTAMP,
    reason TEXT NOT NULL,
    evidence_url VARCHAR(500), -- Cloudinary URL for supporting documents
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log (for compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_attendance_trainee_date ON attendance_records(trainee_id, session_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);

CREATE INDEX idx_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_sessions_program ON training_sessions(program_id);
CREATE INDEX idx_sessions_status ON training_sessions(status);

CREATE INDEX idx_enrollments_trainee ON enrollments(trainee_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);

CREATE INDEX idx_correction_requests_attendance ON correction_requests(attendance_id);
CREATE INDEX idx_correction_requests_status ON correction_requests(status);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for multi-tenant security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic examples - adjust based on actual security requirements)
CREATE POLICY attendance_records_policy ON attendance_records
    FOR ALL TO authenticated_users
    USING (
        trainee_id = current_user_id() OR 
        EXISTS (SELECT 1 FROM users WHERE id = current_user_id() AND role IN ('admin', 'supervisor'))
    );

-- Views for common queries
CREATE VIEW attendance_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.department_id,
    d.name as department_name,
    COUNT(ar.id) as total_sessions,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    ROUND(
        (COUNT(CASE WHEN ar.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(ar.id), 0)), 2
    ) as attendance_percentage
FROM users u
LEFT JOIN attendance_records ar ON u.id = ar.trainee_id
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.role = 'trainee'
GROUP BY u.id, u.full_name, u.department_id, d.name;
