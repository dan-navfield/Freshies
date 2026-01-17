-- Inspect Schema for Routines
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name IN ('routines', 'routine_steps', 'routine_completions', 'routine_products')
ORDER BY 
    table_name, ordinal_position;
