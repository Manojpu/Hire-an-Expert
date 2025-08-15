-- SQL script to manually drop the preferences table
-- Run this if the migration didn't drop it properly

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'preferences') THEN
        -- Drop the table with CASCADE to remove all constraints
        DROP TABLE IF EXISTS preferences CASCADE;
        RAISE NOTICE 'Preferences table dropped successfully';
    ELSE
        RAISE NOTICE 'Preferences table does not exist';
    END IF;
END $$; 