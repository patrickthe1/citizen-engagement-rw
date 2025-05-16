-- For development reset only - uncomment these DROP statements when needed
-- DROP TABLE IF EXISTS submissions;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS agencies;

-- Create agencies table
CREATE TABLE agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agency_id INTEGER REFERENCES agencies(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (for admin access)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    agency_id INTEGER REFERENCES agencies(id),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    agency_id INTEGER REFERENCES agencies(id),
    subject VARCHAR(255),
    description TEXT NOT NULL,
    citizen_contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Received' CHECK (status IN ('Received', 'In Progress', 'Resolved', 'Closed')),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_submissions_ticket_id ON submissions(ticket_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_category_id ON submissions(category_id);
CREATE INDEX idx_submissions_agency_id ON submissions(agency_id);
CREATE INDEX idx_users_agency_id ON users(agency_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_agency_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
