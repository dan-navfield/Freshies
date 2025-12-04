-- Mark existing child test user as having completed onboarding
UPDATE profiles
SET onboarding_completed = true
WHERE email = 'childtest@test.com';

-- Verify the update
SELECT 
  id,
  email,
  role,
  onboarding_completed,
  created_at
FROM profiles
WHERE email = 'childtest@test.com';
