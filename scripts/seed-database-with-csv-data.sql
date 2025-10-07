-- Script to populate the programs table with data from your CSV
-- This assumes your CSV data has been imported into the programs table

-- If you need to import CSV data, you can use this command in PostgreSQL:
-- COPY programs("Institution", "Faculty", "Program Name", "Program Code", "Duration", "Minimum Points Required", "Admission Requirements (Readable)", "Admission Requirements (Structured)", "Career Possibilities", "Interest Category")
-- FROM '/path/to/your/programs.csv'
-- DELIMITER ','
-- CSV HEADER;

-- Update any missing or null values
UPDATE programs 
SET "Faculty" = 'General Faculty' 
WHERE "Faculty" IS NULL OR "Faculty" = '';

UPDATE programs 
SET "Duration" = '3 years' 
WHERE "Duration" IS NULL OR "Duration" = '';

UPDATE programs 
SET "Minimum Points Required" = 25 
WHERE "Minimum Points Required" IS NULL OR "Minimum Points Required" = 0;

-- Clean up any data inconsistencies
UPDATE programs 
SET "Institution" = UPPER(TRIM("Institution"));

-- Add any missing program codes based on institution and program name
UPDATE programs 
SET "Program Code" = CONCAT(
  CASE 
    WHEN "Institution" = 'UNAM' THEN '33'
    WHEN "Institution" = 'NUST' THEN '07'
    WHEN "Institution" = 'IUM' THEN '01'
    ELSE '00'
  END,
  LPAD(id::text, 3, '0')
)
WHERE "Program Code" IS NULL OR "Program Code" = '';
