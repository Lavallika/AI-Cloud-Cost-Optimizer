-- ============================================================
-- Migration: Add user_id to cloud_costs table
-- Safe migration — does NOT delete or modify existing records
-- Existing records will have user_id = NULL (pre-auth data)
-- ============================================================

-- Step 1: Add user_id column if it does not already exist
ALTER TABLE cloud_costs
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Step 2: Add foreign key constraint if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cloud_costs_user_id_fkey'
      AND table_name = 'cloud_costs'
  ) THEN
    ALTER TABLE cloud_costs
    ADD CONSTRAINT cloud_costs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create index for user-specific queries if it does not already exist
CREATE INDEX IF NOT EXISTS idx_cloud_costs_user_id
ON cloud_costs(user_id);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cloud_costs'
ORDER BY ordinal_position;
