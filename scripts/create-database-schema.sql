-- Creating database schema for university programs and related data
-- Updated schema to work with existing CSV data structure

-- Create programs table to match your existing CSV structure
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  "Institution" VARCHAR(10) NOT NULL,
  "Faculty" TEXT,
  "Program Name" TEXT NOT NULL,
  "Program Code" VARCHAR(20),
  "Duration" VARCHAR(20),
  "Minimum Points Required" INTEGER,
  "Admission Requirements (Readable)" TEXT,
  "Admission Requirements (Structured)" TEXT,
  "Career Possibilities" TEXT,
  "Interest Category" TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create general_requirements table for university admission requirements
CREATE TABLE IF NOT EXISTS general_requirements (
  id SERIAL PRIMARY KEY,
  institution VARCHAR(10) NOT NULL UNIQUE CHECK (institution IN ('UNAM', 'NUST', 'IUM')),
  degree_requirements JSONB NOT NULL,
  diploma_requirements JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create interest_categories table
CREATE TABLE IF NOT EXISTS interest_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_institution ON programs("Institution");
CREATE INDEX IF NOT EXISTS idx_programs_min_points ON programs("Minimum Points Required");
CREATE INDEX IF NOT EXISTS idx_programs_program_name ON programs("Program Name");

-- Insert default general requirements
INSERT INTO general_requirements (institution, degree_requirements, diploma_requirements) 
VALUES 
  ('UNAM', '{"minPoints": 25, "englishRequirement": "NSSCO C or better", "alternativeOptions": ["2 subjects NSSCH grade 4+, 3 subjects NSSCO C+, English C", "3 subjects NSSCH grade 4+, 2 subjects NSSCO D+, English C"]}', '{"minPoints": 24, "englishRequirement": "NSSCO D or better"}'),
  ('NUST', '{"minPoints": 25, "englishRequirement": "NSSCO E or better", "alternativeOptions": []}', NULL),
  ('IUM', '{"minPoints": 25, "englishRequirement": "NSSCO D or better", "alternativeOptions": []}', NULL)
ON CONFLICT (institution) DO NOTHING;

-- Insert default interest categories
INSERT INTO interest_categories (category_name) 
VALUES 
  ('Technology & Computing'),
  ('Health & Medicine'),
  ('Engineering & Construction'),
  ('Business & Finance'),
  ('Science & Research'),
  ('Arts & Communication'),
  ('Education & Social Work'),
  ('Agriculture & Environment'),
  ('Law & Justice'),
  ('Tourism & Hospitality'),
  ('Mathematics & Statistics'),
  ('Military & Security')
ON CONFLICT (category_name) DO NOTHING;
