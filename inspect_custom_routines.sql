-- Inspect custom_routines
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'custom_routines'
ORDER BY 
    ordinal_position;
