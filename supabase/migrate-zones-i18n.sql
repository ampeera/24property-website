-- =============================================
-- Migration: Update zones.name to JSONB for i18n
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Add temporary column
ALTER TABLE zones ADD COLUMN name_new JSONB;

-- Step 2: Migrate existing data to JSONB format
UPDATE zones SET name_new = jsonb_build_object(
    'th', CASE id 
        WHEN 'A' THEN 'โป่ง / Tomorrowland'
        WHEN 'B' THEN 'จุดพักรถมอเตอร์เวย์ใหม่ / ศรีราชา'
        WHEN 'C' THEN 'นิคมอุตสาหกรรม / พนัสนิคม'
        ELSE name
    END,
    'en', name
);

-- Step 3: Drop old column and rename new one
ALTER TABLE zones DROP COLUMN name;
ALTER TABLE zones RENAME COLUMN name_new TO name;

-- Step 4: Set NOT NULL constraint
ALTER TABLE zones ALTER COLUMN name SET NOT NULL;
ALTER TABLE zones ALTER COLUMN name SET DEFAULT '{}';

-- Verify the migration
SELECT id, icon, name FROM zones;
