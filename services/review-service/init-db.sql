-- Initialize review service database
-- This script runs when the PostgreSQL container starts for the first time
-- Create schema if it doesn't exist (optional)
-- CREATE SCHEMA IF NOT EXISTS review_schema;
-- The database and user are created by the POSTGRES_* environment variables
-- This file can be used for any additional initialization if needed
-- Log initialization
SELECT 'Review Service Database initialized successfully!' as status;