-- 1. Check all shelf items and their owners/profiles
SELECT 
    si.id, 
    si.product_name, 
    si.user_id, 
    si.profile_id, 
    mc.first_name as child_name
FROM shelf_items si
LEFT JOIN managed_children mc ON si.profile_id = mc.id;

-- 2. Check all managed children to verify IDs
SELECT id, first_name, parent_id, status FROM managed_children;

-- 3. Check Row Level Security (RLS) Policies on shelf_items
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'shelf_items';

-- 4. Check items specifically for 'Ruby'
SELECT si.id, si.product_name, si.user_id, si.profile_id
FROM shelf_items si
JOIN managed_children mc ON si.profile_id = mc.id
WHERE mc.first_name = 'Ruby';
