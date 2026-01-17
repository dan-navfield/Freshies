
-- Add avatar_config column to managed_children
ALTER TABLE managed_children 
ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{}'::jsonb;

-- Update Ruby to have a default emoji config (Dark skin person, similar to screenshot but emoji style)
UPDATE managed_children 
SET avatar_config = '{"emoji": "👧🏾", "backgroundColor": "#b6e3f4"}'::jsonb
WHERE first_name = 'Ruby';

-- Clear the hardcoded avatar_url so the app prefers the config
UPDATE managed_children 
SET avatar_url = NULL 
WHERE first_name = 'Ruby';
