-- Seed data for Citizen Engagement System database (DEPLOYMENT VERSION)
-- This file contains INSERT statements to populate initial data in a deployed database

-- Agency data: Based on the Rwandan government structure
INSERT INTO agencies (name, contact_email, contact_information, created_at, updated_at)
VALUES 
  ('Ministry of Local Government (MINALOC)', 'complaints@minaloc.gov.rw', 'Contact: complaints@minaloc.gov.rw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Rwanda Utilities Regulatory Authority (RURA)', 'complaints@rura.gov.rw', 'Contact: complaints@rura.gov.rw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Ministry of Health (MOH)', 'complaints@moh.gov.rw', 'Contact: complaints@moh.gov.rw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Ministry of Education (MINEDUC)', 'complaints@mineduc.gov.rw', 'Contact: complaints@mineduc.gov.rw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Category data: Based on the research findings of common complaint areas
INSERT INTO categories (name, description, agency_id, created_at, updated_at)
VALUES 
  ('Water Services', 'Issues related to water supply, quality, billing, or infrastructure', 
   (SELECT id FROM agencies WHERE name = 'Rwanda Utilities Regulatory Authority (RURA)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('Electricity Services', 'Issues related to electricity supply, outages, billing, or infrastructure', 
   (SELECT id FROM agencies WHERE name = 'Rwanda Utilities Regulatory Authority (RURA)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('Public Transportation', 'Issues related to public transport availability, schedules, conditions, or fares', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Local Government (MINALOC)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('Healthcare Services', 'Issues related to public healthcare facilities, services, or accessibility', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Health (MOH)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('Education Services', 'Issues related to public schools, universities, or educational policies', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Education (MINEDUC)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('Administrative Services', 'Issues related to government documentation, processes, or services', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Local Government (MINALOC)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('General', 'General inquiries or issues not covered by other categories', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Local Government (MINALOC)'),
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User data: Admin users with bcrypt hashed password (password123)
-- The password hash is already properly encrypted with bcrypt
INSERT INTO users (username, password_hash, agency_id, role, created_at, updated_at)
VALUES 
  ('minaloc_admin', '$2a$12$JyAvWvML6j1XWSv3L/ZaAeBEc9JMIuhou4.m2dcZqkLPvli.Pdtui', 
   (SELECT id FROM agencies WHERE name = 'Ministry of Local Government (MINALOC)'), 
   'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
   
  ('rura_admin', '$2a$12$JyAvWvML6j1XWSv3L/ZaAeBEc9JMIuhou4.m2dcZqkLPvli.Pdtui', 
   (SELECT id FROM agencies WHERE name = 'Rwanda Utilities Regulatory Authority (RURA)'), 
   'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
