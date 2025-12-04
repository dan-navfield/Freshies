-- Check the profile
SELECT * FROM profiles WHERE email = 'childtest@test.com';

-- Check if there's a child_profiles record
SELECT * FROM child_profiles WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'childtest@test.com'
);

-- Check if there's a managed_children record
SELECT * FROM managed_children WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'childtest@test.com'
);
